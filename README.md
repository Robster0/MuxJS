# MuxJS

HTTP framework for **Node.js** inspired by the package mux in go.


```js
const MuxJS = require('muxjs-http')

MuxJS.ListenAndServe(3000)

const r = MuxJS.NewRouter()

r.HandleFunc('/', handler).Method('GET')

function handler(w, r) {
    w.Send(`Hello World!`)
}
```

# Installation
```
$ npm install muxjs-http
```

## Documentation/Demonstration

https://github.com/robin-andreasson/MuxJS/tree/beta/demonstration
