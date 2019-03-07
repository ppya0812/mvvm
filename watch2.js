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
  let vm = this
  let computed = this.$options.computed
  Object.keys(computed).forEach(key => {
    Object.defineProperty(vm, key, {
      get: typeof computed[key] === 'function' ? computed[key] : computed[key].get,
      set() {}
    })
  })
}

function mmvm (options = {}) {
  this.$options = options
  initComputed.call(this)
  let data = this._data = this.$options.data
  Object.keys(data).forEach(key => {
    const dep = new Dep()
    Object.defineProperty(this, key, {
      configurable: true,
      get () {
        dep.addSub()
        return this._data[key]
      },
      set (newV) {
        this._data[key] = newV
        dep.notify()
      }
    })
  })
  console.log(this._data)
  console.log(this.price, this.total, this.quantity)
  this.price = 20
  console.log(this._data)
  console.log(this.price, this.total, this.quantity)
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
  }
})
