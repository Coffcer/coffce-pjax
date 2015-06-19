/*jshint eqnull: true, esnext: true, sub: true, browser: true, devel: true*/
/*global define, module */

/*!
 * Coffce-Pjax
 * 
 * coffce-pjax可以将页面所有的跳转替换为ajax请求，把网站改造成单页面应用。
 */

(function(window, undefined) {
    
    // 配置
    var config = {
        // 选择器，支持querySelector选择器
        selector: "a",
        // 要替换内容的容器，可为选择器字符串或DOM对象
        container: "body",
        // 是否在前进后退时开启本地缓存功能
        cache : true,
        // 是否对低版本浏览器启用hash方案
        hash: false,
        // 是否允许跳转到当前相同URL，相当于刷新
        same: true,
        // 调试模式，console.log调试信息
        debug: false,
        // （未完成）服务器是否支持，为true时表示服务器将根据HTTP头coffce-pjax返回片段HTML，为false时表示服务器将整个页面html，由插件内部获取需要片段
        // serverSupport: true,
        // 各个执行阶段的过滤函数，返回false则停止pjax执行
        filter: {
            // params: element
            // 选择器过滤，如果querySelector无法满足需求，可以在此函数里二次过滤
            selector: null,
            // params: { title, content }
            // 接收到ajax请求返回的内容时触发
            content: null,
            // （未完成）缓存过滤
            // cache: null
        },
        // 各个阶段的自定义函数，将替换默认实现
        custom: {
            // params: html, container
            // 自定义更换页面函数，可以在此实现动画效果等
            append: null
        }
    };
    
    // 使用模式 枚举
    var SUPPORT = {
        // 不支持
        PASS: 0,
        // 使用Hash
        HASH: 1,
        // 使用HTML History API
        HTML5: 2
    };

    // 浏览器支持情况
    var suppost = history.pushState ? SUPPORT.HTML5 : ("onhashchange" in window ? SUPPORT.HASH : SUPPORT.PASS);
    
    var util = {
        // 合并两个对象，浅拷贝，使用需小心
        extend: function(obj1, obj2) {
            if (!obj2) return; 

            for (var key in obj2) {
                if (obj2.hasOwnProperty(key)) {
                    obj1[key] = obj2[key];
                }
            }
            
            return obj1;
        },
        // 输出调试信息
        // 仅在config.debug为true时输出
        log: function(text) {
            if (config.debug) {
                console.log("coffce-pjax: " + text);
            }    
        },
        // 返回url中的路径
        // 如：www.google.com/abcd 返回 /abcd
        getPath: function(url) {
            return url.replace(location.protocol + "//" + location.host, "");
        },
        // 获取完整的href
        getFullHref: function(href) {
            var a = document.createElement("a");
            a.href = href;
            return a.href;
        },
        // 判断dom是否匹配选择器
        matchSelector: function(element, selector) {
            var match = 
                document.documentElement.webkitMatchesSelector || 
                document.documentElement.mozMatchesSelector || 
                document.documentElement.msMatchesSelector ||
                // 兼容IE8及以下浏览器
                function(selector, element) {
                    // 这是一个好方法，可惜IE8连indexOf都不支持
                    // return Array.prototype.indexOf.call(document.querySelectorAll(selector), this) !== -1;
                    
                    if (element.tagName === selector.toUpperCase()) return true;
                    
                    var elements = document.querySelectorAll(selector),
                        length = elements.length;
                    
                    while (length--) {
                        if (elements[length] === this) return true;
                    }
                    
                    return false;
                };
            
            // 重写函数自身，使用闭包keep住match函数，不用每次都判断兼容
            util.matchSelector = function(element, selector) {
                return match.call(element, selector);
            };
            
            return util.matchSelector(element, selector);
        }
    };
    
    var cache = {
        key: function(url) {
            return "coffce-pjax[" + url + "]";
        },
        get: function(url) {
            var value = sessionStorage.getItem(cache.key(url));
            return value != null ? JSON.parse(value) : null;
        },
        set: function(url, value) {
            // storage有容量上限，超出限额会报错
            try {
                sessionStorage.setItem(cache.key(url), JSON.stringify(value));
            }
            catch(e) {
                util.log("超出本地存储容量上线，本次操作将不使用本地缓存");
            }
        },
        clear: function() {
            for (var i = 0; i < sessionStorage.length; i++) {
                var key = sessionStorage.key(i);
                if (key.indexOf("coffce-pjax")) {
                    sessionStorage.removeItem(key);
                }
            }
        },
    };
    
    var event = {
        // 在浏览器前进后退时执行
        popstate: function() {
            core.fnb = true;
            core.turn(location.href, null, null);
        },
        // hash改变时执行，由于过滤了手动改变，所以也只在浏览器前进后退时执行
        hashchange: function() {
            if (!core.fnb) return;
            core.turn(location.href.replace("#/", ""), null, null);
        },
        click: function(e) {
            var element = e.target || e.srcElement;
            
            // 过滤不匹配选择器的元素
            if (element.tagName !== config.selector && !util.matchSelector(element, config.selector)) return;
            
            // 过滤函数
            if (config.filter.selector && !config.filter.selector(element)) return;
            
            // 优先使用data-coffce-href
            var url = element.getAttribute("data-coffce-pjax-href");
            url = url ? util.getFullHref(url) : element.href;
            
            // 过滤空值
            if (url === "") return;

            // 阻止默认跳转，
            // 在这上面的return，仍会执行默认跳转，下面的就不会了
            if (e.preventDefault) {
                e.preventDefault();
            }
            else {
                window.event.returnValue = false;
            }

            // 阻止相同链接
            if (!config.same && url === location.href) return;

            // 标签上有这个值的话，将作为data传入新页面
            var data = element.getAttribute("data-coffce-pjax");

            core.fnb = false;
            core.turn(url, data, null);
        },
        bindEvent: function() {
            if (suppost === SUPPORT.HTML5) {
                window.addEventListener("popstate", event.popstate);
                window.addEventListener("click", event.click);
            }
            else {
                window.attachEvent("onhashchange", event.hashchange);
                document.documentElement.attachEvent("onclick", event.click);
            }
        },
        unbindEvent: function() {
            if (suppost === SUPPORT.HTML5) {
                window.removeEventListener("popstate", event.popstate);
                window.removeEventListener("click", event.click);
            }
            else {
                window.detachEvent("onhashchange", event.hashchange);
                document.documentElement.detachEvent("onclick", event.click);
            }
        }
    };
    
    var core = {
        // Forward And Back，表示当前操作是否由前进和后退触发
        fnb: false,
        // 替换页面标题和内容
        show: function(title, html) {
            document.title = title;
            
            if (config.custom.append) {
                config.custom.append(html, config.container);
            }
            else {
                config.container.innerHTML = html;
            }
        },
        // 跳转到指定页面
        turn: function(url, data, callback) {
            var eventData = { url: url, fnb: core.fnb, data: data };
            
            pjax.trigger("begin", null, eventData);

            // 如果是由前进后退触发，并且开启了缓存，则试着从缓存中获取数据
            if (core.fnb && config.cache) {
                var value = cache.get(url);
                if (value != null) {
                    core.show(value.title, value.html);
                    pjax.trigger("success", null, eventData);
                    return;
                }
            }
            
            // 开始发送请求
            var xhr = new XMLHttpRequest();

            xhr.open("GET", url, true);
            xhr.setRequestHeader("COFFCE-PJAX", "true");
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
                        var title = xhr.getResponseHeader("COFFCE-PJAX-TITLE") || document.title,
                            html = xhr.responseText;

                        // 内容过去器
                        if (config.filter.content && !config.filter.content(title, html)) return;

                        // 显示新页面
                        core.show(title, html);
                        
                        if (!core.fnb) {
                            // 修改URL
                            if (suppost === SUPPORT.HTML5) {
                                history.pushState(null, null, url);
                            }
                            else {
                                location.hash = util.getPath(url);
                            }

                            // 添加到缓存
                            if (config.cache) {
                                cache.set(url, { title: title, html: html });
                            }
                        }
                        
                        if (callback) callback(data);
                        pjax.trigger("success", null, eventData);
                    }
                    else {
                        eventData.errCode = xhr.status;
                        pjax.trigger("error", null, util.extend(eventData));
                        
                        util.log("请求失败，错误码：" + xhr.status);
                    }
                    
                    core.fnb = true;
                    pjax.trigger("end", null, eventData);
                }
            };
            xhr.send();
        }
    };
    
    var pjax = {
        events: {},
        /**
         * 初始化
         * @param {Object} options 配置
         */
        init: function(options) {
            if (suppost === SUPPORT.PASS) {
                util.log("不支持该版本的浏览器");
                return;
            }
            
            util.extend(config, options);

            if (typeof config.container === "string") {
                config.container = document.querySelector(config.container);
            }
            
            // 如果一打开就已经带有hash, 则立刻发请求
            if (suppost === SUPPORT.HASH && location.hash.length > 2) {
                // 先删了当前内容（一般为主页），防止用户误会
                config.container.innerHTML = "";
                
                core.fnd = false;
                core.turn(location.href.replace("#/", ""), null, null);
            }
            
            event.bindEvent();
        },
        /**
         * 注销插件
         * 一般来说你并不需要使用这个方法
         */
        destroy: function() {
            pjax.events = null;
            event.unbindEvent();
            util.clearCache();
        },
        /**
         * 使用pjax跳转到指定页面
         * @param {String}   url
         * @param {Object}   data     要传到新页面的参数，可以为null
         * @param {Function} callback 请求成功时的回调
         */
        turn: function(url, data, callback) {
            url = util.getFullHref(url);
            core.fnb = false;
            core.turn(url, data, callback);
        },
        /**
         * 监听事件
         * @param {String}   type     事件类型
         * @param {String}   url      指定监听该事件的页面，null表示所有页面都监听
         * @param {Function} listener 回调
         */
        on: function(type, url, listener) {
            if (arguments.length === 2) {
                listener = url;
                url = null;
            }
            else if (url) {
                url = util.getFullHref(url);    
            }
            
            pjax.events[type] = pjax.events[type] || [];
            pjax.events[type].push({
                listener: listener,
                url: url
            });
        },
        /**
         * 解除监听
         * @param {String} type 事件类型
         * @param {String} url 解绑该事件的页面，null表示所有页面都解绑
         */
        off: function(type, url) {
            var list = pjax.events[type];
            if (url) {
                url = util.getFullHref(url);
                for (var i = 0; i < list.length;  i++) {
                    if (list[i].url === url) {
                        list.splice(i, 1);
                        i--;
                    }
                }
                return;
            }
            
            pjax.events[type] = null;
        },
        /**
         * 触发事件
         * @param {String} type 事件类型
         * @param {String} url  只触发该页面的事件，null表示所有页面都触发
         * @param {Object} args 参数
         */
        trigger: function(type, url, args) {
            if (typeof url === "object") {
                args = url;
                url = null;
            }
            else if (url) {
                url = util.getFullHref(url);
            }
            
            var list = pjax.events[type];
            if (list != null) {
                for (var i = 0, length = list.length; i < length; i++) {
                    if (list[i].url == url) {
                        list[i].listener.call(pjax, args);
                    }
                }
            }
        }
    };
    
    if (typeof define === "function" && define.amd) {
        define([], function() { return pjax; });
    }
    else if (typeof module === "object" && typeof exports === "object") {
        module.exports = pjax;
    }
    else {
        window.CoffcePJAX = pjax;
    }
    
})(window);