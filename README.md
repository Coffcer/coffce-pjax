# Coffce-PJAX

## 介绍
Coffce-PJAX是一个简单的PJAX库，通过简单的配置，既可将所有a标签替换为AJAX请求。
支持缓存及在各个页面之间传递参数。正常浏览器上使用HTML5 History API，低版本浏览器使用Hash，兼容IE8~IE11，Chrome，Firefox等。

## 用法
####简单配置：
``` javascript
// 引入pjax，也可以使用window.CoffcePJAX
var pjax = require("coffce-pjax");

pjax.init({
    // 替换新页面内容的容器
    container: "body",
    // 是否在低版本浏览器上使用Hash
    hash: true
});
```
####高级配置:
``` javascript
var pjax = require("coffce-pjax");
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

## 接口
####对外接口：
接口 | 描述
-----|-----
pjax.init(config) | 初始化，参数见上面[用法]
pjax.turn(url, data, callback) | 使用pjax方式跳转到指定url。data表示要带到新页面的参数，在callback或者success事件里接收
pjax.on(type, listener) | 监听事件，见下面[事件类型]
pjax.off(type) | 移除监听
pjax.trigger(type, args) | 手动触发事件
pjax.destroy | 注销插件

#### 事件类型：
类型 | 参数 | 描述
-----|------|------
begin   | { url, fnb, data} | 请求开始时执行，url为新页面地址，fnb表示是否由浏览器前进后退触发，data是传到新页面的参数
success | { url, fnb, data} | 请求成功时执行
end     | { url, fnb, data} | 请求结束时执行，无论成功与否
error   | { url, fnb, data, errCode} | 请求失败时执行，errCode为xhr.status


## 注意
作者很懒，没有经过详细的测试，使用需自己小心。

## License
MIT