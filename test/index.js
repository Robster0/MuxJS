const MuxJS = require('../MuxJS/muxjs');
const fs = require('fs')


MuxJS.ListenAndServe(3000, (err) => {
    console.log("Server running at port 3000")
})

MuxJS.Static(__dirname + "/static")

MuxJS.CORS({
    origin: 'http://localhost:3001',
    credentials: true,
    methods: 'GET, POST, OPTIONS'
})


const router = MuxJS.NewRouter();

router.Use((w, r, next) => {

    console.log("ROOT ROUTER MIDDLEWARE")
     next.Serve(w, r);
})


router.HandleFunc('/', home).Method('GET')



const subrouter = router.SubRouter().PathPrefix('/api');

subrouter.Use((w, r, next) => {

    console.log("SUB ROUTER MIDDLEWARE")

    next.Serve(w, r)
})

subrouter.HandleFunc('/file', (w, r) => {
    fs.writeFileSync(r.Files.image.name, r.Files.image.data, {
        encoding: 'binary'
    })

    w.SendStatus(201);
}).Method('POST');



function home(w, r) {

    w.SendFile(__dirname + "/html/index.html")
}