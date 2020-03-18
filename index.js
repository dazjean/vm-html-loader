'use strict';
const loaderUtils = require('loader-utils');
const path = require('path');
const fs = require('fs');
const Velocity = require('velocityjs');
const { Compile, parse } = Velocity;
const Loadsh = require('lodash');
const RequirestPromise = require('request-promise');
let watcher;
// resourcePath vm文件路径
const macros = (resourcePath, options, mock) => {
  return {
    parse(filePath) {
      return this.eval(this.include(filePath), mock);
    },
    include(filePath) {
      // console.log(filePath, 'filePath')

      //获取真实路径
      let absPath;
      if (options.basePath) {
        absPath = path.join(options.basePath, filePath);
        // console.log(absPath, 'absPath')
      } else {
        absPath = path.resolve(path.dirname(resourcePath), filePath);
      }
      // console.log(absPath, 'absPath')
      if (!fs.existsSync(absPath)) return '';
      watcher(absPath);
      return fs.readFileSync(absPath, 'utf8');
    }
  };
};

const getRequestAsync = async function(url) {
  let rpbody = await RequirestPromise({ method: 'GET', url: url });
  return rpbody;
};

module.exports = async function(content) {
  if (this.cacheable) {
    this.cacheable(true);
  }
  const callback = this.async();
  const options = Loadsh.defaults(loaderUtils.getOptions(this), {
    compileVm: true,
    compileEjs: false,
    removeComments: false
  });
  const filePath = this.resourcePath;
  const fileName = path.basename(filePath).split('.')[0];
  const fileDirPath = path.dirname(filePath);

  watcher = this.addDependency;

  let mock = {};
  // 获取mock数据，优先寻找同名.json中的remoteUrl，不存在或者为空寻找同名mock.js
  let remoteUrl = '',
    rootPams = '',
    mockRst = {};
  const remoteMockPath = path.join(fileDirPath, `${fileName}.json`);
  const localMockPath = path.join(fileDirPath, `${fileName}.mock.js`);
  const hookMockPath = path.join(fileDirPath, `${fileName}.hook.js`);
  const vmHtmlLoaderHook = path.join(process.cwd(), './vm-html-loader-hook.js');

  let getLocalMock  = (mockPath)=>{
    watcher(mockPath);
    delete require.cache[mockPath];
    return require(mockPath);
  }
  if (fs.existsSync(remoteMockPath)) {
    watcher(remoteMockPath);
    delete require.cache[remoteMockPath];
    remoteUrl = require(remoteMockPath).remoteUrl || ''; //代理url
    if(remoteUrl==""&&fs.existsSync(localMockPath)){
      //remoteUrl为空时使用本地mock
      mock = getLocalMock(localMockPath);
    }else{
      rootPams = require(remoteMockPath).rootPams || ''; //mock根参数  列表详情都需要包一层属性
      try {
        mockRst = JSON.parse(await getRequestAsync(remoteUrl));
        if (rootPams != '') {
          mock[rootPams] = mockRst;
        }
      } catch (error) {
        console.warn('Request must get link and return JSON format content！！！'+error);
      }  
    }
  } else if (fs.existsSync(localMockPath)) {
    mock = getLocalMock(localMockPath);
  }else {
    console.warn('The folder with the same name of the entry VM file should include index.json or index.mock.js');
  }


  if (fs.existsSync(vmHtmlLoaderHook)){ //先执行项目根目录下的hook
    watcher(vmHtmlLoaderHook);
    let rootHook = require(vmHtmlLoaderHook);
    mock = typeof rootHook =="function" && rootHook(mock);
  }
  if (fs.existsSync(hookMockPath)){ //再执行入口文件同名文件夹下的hook
    watcher(hookMockPath);
    let hook = require(hookMockPath);
    mock = typeof hook =="function" && hook(mock);
  }

  //解析vm
  if (options.compileVm) {
    content = new Compile(parse(content), {
      escape: false,
      unescape: {}
    }).render(mock, macros(filePath, options, mock));
  }
  callback(null, content);
};
