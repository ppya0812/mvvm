let target = null
let data = {
  price: 5,
  quantity: 2
}

class Dep {
  constructor () {
    this.subs = []
  }
  addSub () {
    if (target && !this.subs.includes(target)) {
      this.subs.push(target)
    }
  }
  notify () {
    this.subs.forEach(sub => sub())
  }
}

function Mvvm () {
  Object.keys(data).forEach(key => {
    let dep = new Dep()
    let tmp = data[key]
    Object.defineProperty(data, key, {
      configurable: true,
      get () {
        dep.addSub()
        return tmp
      },
      set (newVal) {
        tmp = newVal
        dep.notify()
      }
    })
  })
}
Mvvm()

function watcher(fn) {
  target = fn
  target()
  target = null
}
watcher(() => {
  data.total = data.price * data.quantity
})
