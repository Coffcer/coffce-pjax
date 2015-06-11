/*jshint eqnull: true, esnext: true, sub: true, browser: true, devel: true*/
/*global define, module */

/*!
 * Coffce-Pjax
 * 
 * Coffce-Pjax is a simple pjax libray. Make all the normal a[href] into ajax href, and change the url.
 * Support forward, back and cache, and you can pass the data between the page. 
 * It will use html5 history API for html5 browsers, and use url hash for IE8, IE9.
 */

(function(window, undefined) {
    
    // 配置
    var config = {
        // 各个执行阶段的过滤函数，返回false则停止pjax执行
        filter: {
            // a标签过滤，
            selector: null,
            // 内容过滤
            content: null,
            // （未完成）缓存过滤
            cache: null
        },
        // 各个阶段的自定义函数，将替换默认实现
        custom: {
            // 自定义更换页面函数
            append: null,
            // （未完成）自定义发送请求函数
            ajax: null
        },
        // 要替换内容的容器，可为选择器字符串或DOM对象
        container: "body",
        // 是否在前进后退时开启本地缓存功能
        cache : true,
        // 是否对低版本浏览器启用hash方案
        hash: false,
        // 是否允许跳转到当前相同URL，相当于刷新
        same: true,
        // （未完成）服务器是否支持，为true时表示服务器将根据HTTP头coffce-pjax返回片段HTML，为false时表示服务器将整个页面html，由插件内部获取需要片段
        serverSupport: true,
        // 调试模式，console.log调试信息
        debug: false
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
        // 合并对象，只是浅拷贝，使用需小心
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
        log: function(text) {
            if (config.debug) {
                console.log(text);
            }    
        },
        // 如：www.google.com/abcd 返回 /abcd
        getPath: function(url) {
            return url.replace(location.protocol + "//" + location.host, "");
        },
        // 获取缓存Key
        getCacheKey: function(url) {
            return "coffce-pjax[" + url + "]";
        },
        // 获取缓存
        getCache: function(url) {
            var cache = sessionStorage.getItem(util.getCacheKey(url));
            return cache != null ? JSON.parse(cache) : null;
        },
        // 设置缓存
        setCache: function(url, value) {
            // storage有容量上限，超出限额会报错
            try {
                sessionStorage.setItem(util.getCacheKey(url), JSON.stringify(value));
            }
            catch(e) {
                util.log("coffce-pjax: 超出本地存储容量上线，本次操作将不使用本地缓存");
            }
        },
        clearCache: function() {
            for (var i = 0; i < sessionStorage.length; i++) {
                var key = sessionStorage.key(i);
                if (key.indexOf("coffce-pjax")) {
                    sessionStorage.removeItem(key);
                }
            }
        }
    };
    
    var event = {
        popstate: function() {
            core.fnb = true;
            core.turn(location.href, null);
        },
        hashchange: function() {
            // 过滤掉手动请求，只响应浏览器前进后退
            if (!core.fnb) return;
            core.turn(location.href.replace("#/", ""), null);
        },
        html5Click: function(e) {
            var element = e.target;
            if (element.tagName === "A") {
                var url = element.href;

                // 过滤选择器
                if (config.filter.selector) {
                    var result = config.filter.selector(element);
                    if (!result) return;
                }
                if (url === "") return;

                // 阻止默认跳转
                e.preventDefault();

                // 阻止相同链接
                if (!config.same && url === location.href) return;

                // 标签上有这个值的话，将作为data传入新页面
                var data = element.getAttribute("data-coffce-pjax");

                core.fnb = false;
                core.turn(url, data, null);
            }
        },
        hashClick: function(e) {
            var element = e.srcElement;
            if (element.tagName === "A") {
                var url = element.href;

                // 过滤
                if (config.filter.selector) {
                    var result = config.filter.selector(element);
                    if (!result) return;
                }
                if (url === "") return;

                // 阻止默认跳转
                window.event.returnValue = false;

                // 阻止相同链接
                if (!config.same && url === location.href) return;

                // 标签上有这个值的话，将作为data传入新页面
                var data = element.getAttribute("data-coffce-pjax");

                core.fnb = false;
                core.turn(url, data, null);
            }
        },
        bindEvent: function() {
            if (suppost === SUPPORT.HTML5) {
                window.addEventListener("popstate", event.popstate);
                window.addEventListener("click", event.html5Click);
            }
            else {
                window.attachEvent("onhashchange", event.hashchange);
                document.documentElement.attachEvent("onclick", event.hashClick);
            }
        },
        removeEvent: function() {
            if (suppost === SUPPORT.HTML5) {
                window.removeEventListener("popstate", event.popstate);
                window.removeEventListener("click", event.html5Click);
            }
            else {
                window.detachEvent("onhashchange", event.hashchange);
                document.documentElement.detachEvent("onclick", event.hashClick);
            }
        }
    };
    
    var core = {
        // Forward And Back，表示当前操作是否由前进和后退触发
        fnb: false,
        // 替换页面标题和内容
        replace: function(obj) {
            document.title = obj.title;
            
            if (config.custom.append) {
                config.custom.append(obj.html, config.container);
            }
            else {
                config.container.innerHTML = obj.html;
            }
        },
        // 跳转到指定页面
        turn: function(url, data, callback) {
            var eventData = { url: url, fnb: core.fnb, data: data };
            
            pjax.trigger("start", eventData);

            // 如果是由前进后退触发，并且开启了缓存，则试着从缓存中获取数据
            if (core.fnb && config.cache) {
                var cache = util.getCache(url);
                
                if (cache != null) {
                    core.replace(cache);
                    pjax.trigger("success", eventData);

                    return;
                }
            }
            
            // 发送请求
            var xhr = new XMLHttpRequest();

            xhr.open("GET", url, true);
            xhr.setRequestHeader("COFFCE-PJAX", "true");
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200 || xhr.status === 304) {
                        var info = {
                            title: xhr.getResponseHeader("COFFCE-PJAX-TITLE") || document.title,
                            html: xhr.responseText
                        };

                        // 过滤内容
                        if (config.filter.content) {
                            var result = config.filter.content(info);
                            if (!result) return;
                        }

                        // 替换页面内容
                        core.replace(info);
                        
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
                                util.setCache(url, info);
                            }
                        }
                        
                        // 回调
                        if (callback) callback(data);
                        pjax.trigger("success", eventData);
                    }
                    else {
                        pjax.trigger("error", util.extend(eventData, {errCode: xhr.status}));
                        util.log("coffce-pjax: 请求失败，错误码：" + xhr.status);
                    }
                    
                    core.fnb = true;
                }
            };
            xhr.send();
        }
    };
    
    var pjax = {
        events: {},
        init: function(options) {
            if (suppost === SUPPORT.PASS) return;
            
            
            util.extend(config, options);

            if (typeof config.container === "string") {
                config.container = document.querySelector(config.container);
            }
            
            // 如果一打开就已经带有hash, 则立刻发请求
            if (suppost === SUPPORT.HASH && location.hash.length > 1 && location.hash !== "#/") {
                // 先删了当前内容（一般为主页），防止用户误会
                config.container.innerHTML = "";
                
                core.fnd = false;
                core.turn(location.href.replace("#/", ""), null);
            }
            
            event.bindEvent();
            
            
        },
        // 注销
        destroy: function() {
            pjax.events = null;
            event.removeEvent();
            util.clearCache();
        },
        // 跳转
        turn: function(url, data, callback) {
            core.fnb = false;
            core.turn(url, data, callback);
        },
        // 监听事件
        on: function(type, listener) {
            pjax.events[type] = pjax.events[type] || [];
            pjax.events[type].push(listener);
        },
        // 解除监听
        off: function(type) {
            delete pjax.events[type];
        },
        // 触发事件
        trigger: function(type, args) {
            var list = pjax.events[type];
            if (list != null) {
                for (var i = 0, length = list.length; i < length; i++) {
                    list[i].call(pjax, args);
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
        window.CoffcePjax = pjax;
    }
    
})(window);