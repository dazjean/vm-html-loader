# vm-html-loader
java-velocity render to html with webpack

# 安装
```
npm install vm-html-loader

```

# optino
- `basePath`  vm中#parse根路径

# webpack配置
- loader
```js
module:{
    rule:[
        {
        test: /\.vm$/,
        use:[
          {
            loader: 'html-loader'
          },
          {
            loader:'vm-html-loader',
            options: {
              basePath: path.join(__dirname, `./view`)
            }  //basePath  vm中#parse根路径
          }
        ]
      }
    ]
}
```

- plugins
```js
    new HtmlWebpackPlugin({
      template:  path.resolve(
        __dirname,
        `../views/index.vm`   
      ), 
      inject: true
    })
 //template 指向项目vm入口文件
```



# mock数据
> mock数据格式有两种方式，接口代理和本地json
- 接口代理

默认首先寻找模板入口文件下index.vm同名的index.json文件下的代理接口地址
```json
{
    "remoteUrl":"https://www.getyoumock.com/json", // 远程请求
    "rootPams":"detailInfo" //是否要添加根命名空间 非必填
}
```

- 本地json

如果没有index.js或者remoteUrl为空，mock数据直接取index.vm同级目录下index.mock.js中的json数据
```js
module.exports = {
     "resultModel":{
         //列表或详情json数据
     }
}
```


# mock数据hook
> 对mock数据进行格式化处理，主要是为了兼容java自定义的vm语法和无法被mock的其他方法;eg:`$commonhelper.cdnCssUrl('https:cdn.com/xxxx.css')`

mock数据自定义加工有两种方式
- vm-html-loader-hook.js(根目录)
```
module.export = (content)=>{
    content.commonhelper.cdnCssUrl = (url)=>{
        return url;
    }
    return content;
}

```
- index.hook.js(view/index.vm同文件夹同名hook)
```
module.export = (content)=>{
    //todo
    return content;
}

```

