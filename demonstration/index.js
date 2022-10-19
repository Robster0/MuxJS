//Instance
const MuxJS = require('../src/index');

const { read, readOne, create_GET, create_POST, update, del } = require('./handlers/CRHandlers')
const { home, error } = require('./handlers/indexHandlers')



//Starts a server at specified port
MuxJS.ListenAndServe(3000, (error) => {

    if(error) return console.log(error);


    console.log("Starting server at port: ", MuxJS.Port);
})

//Load static files. Image, css, javascript files, etc.
MuxJS.Static(__dirname + '/static')

/*
    Add built in muxjs function/options that helps with common problems.

    Size limit for files and method override is currently the only option available
*/
MuxJS.Utilize(MuxJS.Json());

MuxJS.Utilize(MuxJS.XmlParser());

MuxJS.Utilize(MuxJS.UrlEncoded());

MuxJS.Utilize(MuxJS.MultiPartFormData());

MuxJS.Utilize(MuxJS.FileUpload());

MuxJS.Utilize(MuxJS.MethodOverride());

/*
    Add Access-Control-Allow headers
*/
MuxJS.CORS({
    origins: ['http://localhost:3000', 'http://localhost:3001'],
    methods: 'GET, POST, OPTIONS, PUT, DELETE',
    credentials: true,
    headers: 'x-request-with'
})

/*
    Global Preflight request handler
    
    Note: automatically ignores any OPTIONS handler if preflight handler has been initialized
*/
MuxJS.PreFlight((w, r) => {

    w.SetHeaders({
        'Access-Control-Allow-Headers': '*'
    })


    w.SendStatus(200);
})

//Initializes root router
const r = MuxJS.NewRouter();

r.NotFoundHandler(error)

//Handlers
r.HandleFunc('/', home).Method('GET')

r.HandleFunc('/read', (w, r) => {
    console.log(r);
})

//Initializes a sub router with /crud as pathprefix
const r_crud = r.SubRouter().PathPrefix('/crud')

r_crud.HandleFunc('/read', read).Method('GET')
r_crud.HandleFunc('/read/{id}', readOne).Method('GET')

r_crud.HandleFunc('/create', create_GET).Method('GET')
r_crud.HandleFunc('/create', create_POST).Method('POST')

r_crud.HandleFunc('/update', update).Method('PUT');
r_crud.HandleFunc('/delete', del).Method('DELETE');


const api_r = r.SubRouter().PathPrefix('/api')

