coffce-pjax
===
coffce-pjax可以将页面所有的跳转替换为AJAX请求，把网站改造成单页面应用。


###有何用处：
* 可以在页面切换时增加过渡效果和Loading动画。
* 所有的标签都可以用来跳转，不仅仅是a标签。
* 可以在各个页面间传递数据，不依赖URL。
* 可以选择性的保留状态，如音乐网站，切换页面时候不会停止播放歌曲。
* 避免了公共JS的反复执行，如无需在各个页面打开时都判断是否登录等等。
* 减少了请求体积，加快页面响应速度。
* 不影响SEO。

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
    }
});
```

####服务端配合
一般来说，我们切换页面时Header和Footer是不用动的，只变动Content，所以服务端在接收到PJAX请求后，并不需要返回完整的HTML，只返回Content即可。

coffce-pjax在发送请求时会带上请求头COFFCE-PJAX: true，服务端可以根据此判断当前请求是否是一个PJAX请求，如若是PJAX请求则返回部分HTML。

文档
------
###方法：
```javascript
/**
 * 初始化
 * @param {Object} options 配置，详情见上面↑
 */
pjax.init(config);
```

```javascript
/**
 * 注销插件
 * 一般来说你并不需要使用这个方法
 */
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
 */
pjax.on(type, listener);
```

```javascript
/**
 * 解除监听
 * @param {String} type 事件类型
 */
pjax.off(type);
```

```javascript
/**
 * 触发事件
 * @param {String} type 事件类型
 * @param {Object} args 参数
 */
pjax.trigger(type, args);
```

#### 事件类型：
类型 | 参数 | 描述
-----|------|------
begin   | { url, fnb, data} | 请求开始时执行，url为新页面地址，fnb表示是否由浏览器前进后退触发，data是传到新页面的参数
success | { url, fnb, data} | 请求成功时执行
end     | { url, fnb, data} | 请求结束时执行，无论成功与否
error   | { url, fnb, data, errCode} | 请求失败时执行，errCode为xhr.status

注意：
------
作者很懒，没有认真测试过，使用需自己小心。

License
-----
MIT