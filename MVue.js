const compileUtil = {
  getVal(expr,vm) {
    return expr.split('.').reduce((data,currentVal)=>{
      return data[currentVal]
    },vm.$data)
  },
  getContentVal(expr,vm) {
    return expr.replace(/\{\{(.+?)\}\}/g,(...args) => {
      return this.getVal(args[1],vm);
    })
  },
  text(node,expr,vm){ //expr:msg,vm:当前的实例
    let value;
    if(expr.indexOf('{{') !== -1){
      //处理{{person.name}}--{{person.age}}
      value = expr.replace(/\{\{(.+?)\}\}/g,(...args) => {
        new Watcher(vm,args[1],(newVal) => {
          this.updater.textUpdater(node,this.getContentVal(expr,vm));
        })
        return this.getVal(args[1],vm)
      })
    }else{
      value = this.getVal(expr,vm);
    }
    this.updater.textUpdater(node,value)
  },
  html(node,expr,vm){
    const value = this.getVal(expr,vm);
    new Watcher(vm,expr,(newVal)=>{
      this.updater.htmlUpdater(node,newVal);
    })
    this.updater.htmlUpdater(node,value);
  },
  model(node,expr,vm){
    const value = this.getVal(expr,vm);
    new Watcher(vm,expr,(newVal)=>{
      this.updater.modelUpdater(node,newVal);
    })
    this.updater.modelUpdater(node,value)
  },
  on(node,expr,vm,eventName){
    let fn = vm.$options.methods && vm.$options.methods[expr];
    node.addEventListener(eventName,fn.bind(vm));
  },
  bind(node,expr,vm,attrName){
    let value = this.getVal(expr,vm);
    // console.log(node,expr,vm,attrName,'yy')
    node.setAttribute(attrName,value)
  },
  //更新的函数
  updater:{
    textUpdater(node,value){
      node.textContent = value;
    },
    htmlUpdater(node,value){
      node.innerHTML = value;
    },
    modelUpdater(node,value){
      node.value = value
    }
  }
}
class Compile {
  constructor(el,vm){
    this.el = this.isElementNode(el) ? el:document.querySelector(el);
    this.vm = vm;
    //1、获取文档碎片对象，放入内存中，会 减少页面的回流（重排）和重绘
    const fragment = this.node2Fragment(this.el);
    //2、编译模板
    this.compile(fragment);
    //3、追加子元素至根元素上
    this.el.appendChild(fragment);
  }
  isElementNode(node){
    return node.nodeType === 1;
  };
  compile(fragment) {
    //1、获取到每一个子节点
    const childNodes = fragment.childNodes;
    [...childNodes].forEach(child => {
      if(this.isElementNode(child)) {
        //如果是元素节点则去编译元素节点
        this.compileElement(child);
      }
      else{
        //编译文本节点
        this.compileText(child);
      }
      //子节点递归遍历
      if(child.childNodes && child.childNodes.length){
        this.compile(child)
      }
    });
  };
  compileElement(node) {
    const attributes = node.attributes;
   [...attributes].forEach(attr => {
    //  console.log(attr);
     const {name,value} = attr;
    //  console.log(name,value)
    if(this.isDirective(name)){
      const [,dirctive] = name.split('-');
      const[dirName,eventName] = dirctive.split(':');
      //更新数据，数据驱动视图
      compileUtil[dirName](node,value,this.vm,eventName)
      //删除有指令的标签上的属性
      node.removeAttribute('v-'+dirctive);
    }
    else if(this.isEventName(name)){
      //处理@click = handleClicks
      let [,eventName] = name.split('@');
      compileUtil['on'](node,value,this.vm,eventName);
      node.removeAttribute('@'+eventName)
    }
    else if(this.isBindName(name)){
      let [,Name] = name.split(':');
      compileUtil['bind'](node,value,this.vm,Name);
      node.removeAttribute(':'+Name)
    }
   })
  };

  compileText(node) {
    const content = node.textContent;
    if(/\{\{(.+?)\}\}/.test(content)){
      // console.log(content)
      compileUtil['text'](node,content,this.vm)
    }
  };
  //判断属性以：开头
  isBindName(attrName){
    return attrName.startsWith(':')
  };
  //判断事件指定是否以@开头
  isEventName(attrName){
    return attrName.startsWith('@') 
  };
  //判断是否是指令
  isDirective(attrName){
    return attrName.startsWith('v-') 
  }
  node2Fragment(el) {
    //创建文档碎片
    const f = document.createDocumentFragment();
    let firstChild;
    while(firstChild = el.firstChild) {
      //appendChild 移除DOM节点至f中
      f.appendChild(firstChild); 
   }
   return f
  }
}


class MVue {
  constructor(options){
    this.$el = options.el;
    this.$data = options.data;
    this.$options = options;
    if(this.$el){
      //1、实现一个数据的观察者  observe
      new Observer(this.$data)
      //2、实现一个指令解析器    compile
      new Compile(this.$el,this);
    }
  }
}