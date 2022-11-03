//Instance
const MuxJS = require('../src/index');
const fs = require('fs')

const { read, readOne, create_GET, create_POST, update, del } = require('./handlers/CRHandlers')
const { home, error } = require('./handlers/indexHandlers')


//Starts a server at specified port
MuxJS.ListenAndServe(3000, (err) => {
    if(err) return console.log(err);


    console.log("Starting server at port: ", MuxJS.Port);
})

//Load static files. Image, css, javascript files, etc.
MuxJS.FileServer(__dirname + '/static')

MuxJS.Options({
    RawProperty: false,
    FileUpload: {
        limit: -1,
        output: 'buffer'
    }
})

/*
    Add built in muxjs function/options that helps with common problems.

    Size limit for files and method override is currently the only option available
*/

/*
    Add Access-Control-Allow headers
*/
MuxJS.CORS({
    origins: ['http://localhost:3000', 'http://localhost:3001'],
    methods: 'GET, POST, OPTIONS, PUT, DELETE',
    credentials: true,
    headers: '*'
})

/*
    Global Preflight request handler
    
    Note: automatically ignores any OPTIONS handler if preflight handler has been initialized
*/
MuxJS.PreFlight((w, r) => {

    w.SetHeaders({
        'Access-Control-Allow-Headers': 'content-type'
    })


    w.SendStatus(200);
})

MuxJS.Deploy(MuxJS.Json())//Parse json payloads
MuxJS.Deploy(MuxJS.Cookies())//Parse incoming cookies
MuxJS.Deploy(MuxJS.XmlParser())//Parse xml payloads, NOTE, should only be used with simple xml
MuxJS.Deploy(MuxJS.FileUpload())//Parse binary data into writable files
MuxJS.Deploy(MuxJS.UrlEncoded())//Parse urlencoded payloads
MuxJS.Deploy(MuxJS.MethodOverride())// Checks for the _method query string and changes the request method to either PUT or DELETE
MuxJS.Deploy(MuxJS.MultiPartFormData())//Parses Multipartformdata


//Initializes root router
const r = MuxJS.NewRouter();

r.NotFoundHandler(error)


//Root router handler
r.HandleFunc('/', home).Method('GET')

//Initializes a sub router with /crud as pathprefix
const r_crud = r.SubRouter().PathPrefix('/crud')

//crud handlers
r_crud.HandleFunc('/read', read).Method('GET')
r_crud.HandleFunc('/read/{id}', readOne).Method('GET')

r_crud.HandleFunc('/create', create_GET).Method('GET')
r_crud.HandleFunc('/create', create_POST).Method('POST')

r_crud.HandleFunc('/update', update).Method('PUT');
r_crud.HandleFunc('/delete', del).Method('DELETE');