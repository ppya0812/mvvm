class Dep {
  constructor () {
    this.subs = []
  }
  addSub (sub) {
    if (sub && !this.subs.includes(sub)) {
      console.log('111111')
      this.subs.push(sub)
    }
  }
  notify () {
    this.subs.forEach(sub => sub.update())
  }
}

function initComputed () {
  // computed
  let vm = this
  let computed = this.$options.computed
  Object.keys(computed).forEach(key => {
    Object.defineProperty(vm, key, {
      get: typeof computed[key] === 'function' ? computed[key] : computed[key].get,
      set() {}
    })
  })
}

function Observe (data) {
  let dep = new Dep()
  Object.keys(data).forEach(key => {
    let v = data[key]
    observe(v) // 递归，实现深度数据劫持
    Object.defineProperty(data, key, {
      configurable: true,
      get () {
        Dep.target && dep.addSub(Dep.target) // 将watcher添加到订阅事件中 [watcher]
        return v
      },
      set (newV) {
        if (newV === v) {
          return
        }
        v = newV
        observe(newV) // 当设置为新值后，也需要把新值再去定义成属性
        dep.notify() // 让所有watcher的update方法执行即可
      }
    })
  })
}

function observe (data) {
// 如果不是对象的话就直接return掉,防止递归溢出
  if (!data || typeof data !== 'object') return
  return new Observe(data)
}

function Watcher(vm, v, fn) {
  this.fn = fn
  this.vm = vm
  this.v = v
  // 添加一个事件
  // 这里我们先定义一个属性
  Dep.target = this
  let arr = v.split('.')
  let val = null
  arr.forEach(key => {
    val = vm[key]
  })
  Dep.target = null
}

Watcher.prototype.update = function () {
  let arr = this.v.split('.')
  let val = null
  arr.forEach(key => {
    val = this.vm[key] // 通过get获取到新的值
  })
  this.fn(val)
}

// function watch () {
//   const vm = this
//   const watchKeys = this.$options.watch
//   Object.keys(watchKeys).forEach(key => {
//     new Watcher(vm, key, watchKeys[key])
//   })
// }

function Compile(el, vm) {
  vm.$el = document.querySelector(el)
  let fragment = document.createDocumentFragment()
  // * 如果使用appendChid方法将原dom树中的节点添加到DocumentFragment中时，会删除原来的节点
  while (child = vm.$el.firstChild) {
    fragment.appendChild(child) // 此时将el中的内容放入内存nodeType中
  }
  replace(fragment, vm) // 替换内容
  vm.$el.appendChild(fragment) // 再将文档碎片放入el中
}

function replace(frag, vm) {
  Array.from(frag.childNodes).forEach(node => {
    // 节点类型 1	Element	代表元素   2	Attr	代表属性   3	Text	代表元素或属性中的文本内容。
    let txt = node.textContent
    let reg = /\{\{(.*?)\}\}/g
    if (node.nodeType === 3 && reg.test(txt)) {
      const replaceTxt = () => {
        node.textContent = txt.replace(reg, (matched, placeholder) => {
          // 监听变化，进行匹配替换内容
          new Watcher(vm, placeholder, replaceTxt) 
          return placeholder.split('.').reduce((v, key) => {
            return v[key]
          }, vm)
        })
      }
      replaceTxt()
    }
    if (node.nodeType === 1) {
      let nodeAttr = node.attributes
      Array.from(nodeAttr).forEach(attr => {
        let name = attr.name
        let v = attr.value
        if (name.includes('v-')) {
          node.value = vm[v]
        }
        new Watcher(vm, v, function(newVal) {
          // 当watcher触发时会自动将内容放进输入框中
          node.value = newVal 
        })
        node.addEventListener('input', e => {
          let newV = e.target.value
          vm[v] = newV
        })
      })
    }
    // 如果还有子节点，继续递归replace
    if (node.childNodes && node.childNodes.length) {
      replace(node)
    }
  })
}

function Mvvm (options = {}) {
  this.$options = options
  // 1. computed
  initComputed.call(this)
  let data = this._data = this.$options.data
  // 2. 数据劫持: 给对象增加get,set
  observe(data)
  // 3. 数据代理  eg.mvvm._data.a.b   ===   mvvm.a.b， this 代理了this._data
  Object.keys(data).forEach(key => {
    Object.defineProperty(this, key, {
      configurable: true,
      get () {
        return this._data[key]
      },
      set (newV) {
        this._data[key] = newV
      }
    })
  })
  // 4. watch
  // watch.call(this)
  // 5. 编译
  new Compile(options.el, this)
  options.mounted.call(this) // 这就实现了mounted钩子函数
}
