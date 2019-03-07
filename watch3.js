class Dep {
  constructor () {
    this.subs = []
  }
  addSub (sub) {
    if (sub && !this.subs.includes(sub)) {
      this.subs.push(sub)
    }
  }
  notify () {
    this.subs.forEach(sub => sub())
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

function Watcher(vm, key, fn) {
  this.fn = fn
  Dep.target = fn
  const v = vm._data[key] // 取值触发get,addsub
  Dep.target = null
}

// Watcher.prototype.update = function () {
//   this.fn()
// }
function watch () {
  const vm = this
  const watchKeys = this.$options.watch
  Object.keys(watchKeys).forEach(key => {
    new Watcher(vm, key, watchKeys[key])
  })
}

// function Compile(el, vm) {
//   const watch = vm.$options.watch
// }

function mmvm (options = {}) {
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
  watch.call(this)

  // 5. 编译
  // new Compile(options.el, this)
  console.log(this.price, this.total, this.quantity)
  this.price = 20
  console.log(this.price, this.total, this.quantity)
  this.price = 30
  options.mounted.call(this) // 这就实现了mounted钩子函数
}

mmvm({
  data: {
    price: 5,
    quantity: 2
  },
  computed: {
    total () {
      return this.price * this.quantity
    }
  },
  watch: {
    price () {
      console.log('watch price', this.price)
    }
  },
  mounted () {
    console.log('mounted')
  }
})
