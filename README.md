coffce-pjax
===
coffce-pjax可以将页面所有的跳转替换为AJAX请求，把网站改造成单页面应用。<br>
note: 由于浏览器限制，pjax需要在服务器环境下使用，即不要使用file://xxx.html运行。

###有何用处：
* 可以在页面切换间平滑过渡，增加Loading动画。
* 可以在各个页面间传递数据，不依赖URL。
* 可以选择性的保留状态，如音乐网站，切换页面时不会停止播放歌曲。
* 所有的标签都可以用来跳转，不仅仅是a标签。
* 避免了公共JS的反复执行，如无需在各个页面打开时都判断是否登录过等等。
* 减少了请求体积，节省流量，加快页面响应速度。
* 平滑降级到低版本浏览器上，对SEO也不会有影响。

###兼容性：
* Chrome, Firefox, Safari, Android Browser, IE8+等。
* 在IE8和IE9上使用URL Hash，即地址栏的#号。
* 在更低版本的浏览器和搜索引擎蜘蛛上，保持默认跳转，不受影响。

如何使用
---
####安装：
    npm install coffce-pjax

#### 引入
``` javascript
// 使用全局变量
var pjax = window.CoffcePJAX
```

``` javascript
// 使用commonJS或AMD
var pjax = require("coffce-pjax");
```
####简单配置：
``` javascript
pjax.init({
    // 替换新页面内容的容器
    container: "body",
    // 是否在低版本浏览器上使用Hash
    hash: true
});
```
####完整配置:
``` javascript
pjax.init({
    // 选择器，支持querySelector选择器
    selector: "a",
    // 要替换内容的容器，可为选择器字符串或DOM对象
    container: "body",
    // 是否在前进后退时开启本地缓存功能
    cache : true,
    // 是否对低版本浏览器启用hash方案，不启用此项的低版本浏览器则会按照普通模式跳转
    hash: false,
    // 是否允许跳转到当前相同URL，相当于刷新
    same: true,
    // 调试模式，console.log调试信息
    debug: false,
    
    // 各个执行阶段的过滤函数，返回false则停止pjax执行
    filter: {
        // 选择器过滤，如果querySelector无法满足需求，可以在此函数里二次过滤
        selector: function(a) {},
        // 接收到ajax请求返回的内容时触发
        content: function(title, html) {}
    },
    // 各个阶段的自定义函数，将代替默认函数
    custom: {
        // 自定义更换页面函数，可以在此实现动画效果等
        append: function(html, container) {}
    },
    // 要监听的事件，相当于pjax.on(...)，事件列表看下面
    events: {}
});
```

接口
---
```javascript
/**
 * 初始化
 * @param {Object} options 配置，详情见上面↑
 */
pjax.init(config);
```

```javascript
 // 注销插件，一般来说你不需要使用这个方法
pjax.destroy();
```

```javascript
/**
 * 使用pjax跳转到指定页面
 * @param {String}   url
 * @param {Object}   data     要传到新页面的参数，可以为null或undefined
 * @param {Function} callback 请求成功时的回调，可以为null或undefined
 */
pjax.turn(url, data, callback);
```

```javascript
/**
 * 监听事件，事件类型见下面↓
 * @param {String}   type     事件类型
 * @param {Function} listener 回调
 * @param {String}   url      只监听某个url，可以是相对和绝对路径
 */
pjax.on(type, listener);
pjax.on(type, url, listener);
```

```javascript
/**
 * 解除监听
 * @param {String} type 事件类型
 * @param {String} url  只监听某个url，可以是相对和绝对路径
 */
pjax.off(type);
pjax.off(type, url);
```

```javascript
/**
 * 触发事件
 * @param {String} type 事件类型
 * @param {Object} args 参数
 */
pjax.trigger(type, args);
```

事件
---
####监听事件
```javascript
// 通过接口监听
pjax.on(type, url, function);
pjax.on(type, function);
```
```javsctipy
// 通过配置监听
pjax.init({
    // ....
    events: {
        type: function(){}
    }
});
```

####事件类型
**ready**<br>
调用init后，插件准备完成时调用。这个事件比较特殊，必须通过配置监听而不能接口监听。

**begin**<br>
在请求开始时触发。begin事件有一个object参数： { url, fnb, data }, url表示新页面的url，fnb表示是否由浏览器前进后退触发， data表示传到新页面的数据。

**success**<br>
在请求成功后触发。参数与begin一样。

**end**<br>
在请求结束后触发，无论成功与否。参数与begin一样。

**error**<br>
在请求失败后触发。参数： { url, fnb, data, errCode }，errCode为请求本次http请求的返回码，即xhr.status。


特性
---
* 优先使用标签上的data-coffce-pjax-href，其次使用href
* 标签上若有data-coffce-pjax属性，将作为data属性传递到新页面

```html
// 将跳转到b.html，并传递字符串data
<a href="a.html" data-coffce-pjax-href="b.html" data-coffce-pjax="data"></a>
```

服务端配合
---
* 对于PJAX请求，服务端并不需要返回完整的HTML，只返回变动的Content部分即可。对于普通请求(一般由浏览器地址栏直接打开)，则需要返回完整的HTML。
* coffce-pjax在发送请求时，会带上请求头COFFCE-PJAX：true，你可以依此来判断当前请求是PJAX请求还是普通请求。
* 由于没有返回完整的HTML，服务端应该将document.title放在请求头COFFCE-PJAX-TITLE里。

注意：
------
作者很懒，没有认真测试过，使用需自己小心。

License
-----
MIT