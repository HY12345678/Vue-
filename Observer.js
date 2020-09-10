class Observer{
  constructor(data) {
    this.observe(data);
  }
  observe(data){
    // console.log(data)
    //针对对象
    if(data && typeof data =='object') {
      console.log(data,'data')
      console.log(Object.keys(data))
      Object.keys(data).forEach(key => {
        console.log(data[key])
        this.defineReactive(data,key,data[key]);
      })
    }
  }
  defineReactive(obj,key,value){
    //递归遍历
    this.observe(value);
    Object.defineProperty(obj,key,{
      enumerable:true,
      configurable:false,
      get(){
        return value
      },
      set:(newVal) => {
        this.observe(newVal)
        if(newVal !== value){
          value = newVal;
        }
      }
    })
  }
}