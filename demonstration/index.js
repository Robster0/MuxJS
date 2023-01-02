/*
* No runnable code here just a very simple documentation

!Important:
w parameter: ResponseWriter
r parameter: Request
next parameter: calls the next middleware or handler 
*/


//Instance
const MuxJS = require('muxjs-http')//npm 

//Starts a server at specified port
MuxJS.ListenAndServe(3000, (err) => {
    if(err) return console.log(err);


    console.log("Starting server at port: ", MuxJS.Port);
})

//Load static files. Image, css, javascript files, etc.
MuxJS.FileServer('static')


/*

Set options, 

options shown are currently the only ones supported

RawProperty: removes the Raw property (contains the entire body before parsing) from the request parameter if set false

limit: sets a size limit (in bytes) for incoming files, -1 allows everything
output: sets the output type for the file data, either 'buffer' or 'string'

*/
MuxJS.Options({
    RawProperty: false,
    FileUpload: {
        limit: -1,
        output: 'buffer'
    }
})

/*
    Add Access-Control-Allow headers
*/
MuxJS.CORS({
    origins: ['https://github.com/Robster0/MuxJS', 'https://www.npmjs.com/package/muxjs-http'],
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

/*

Deploy resources needed for the application to work, e.g. parsing
third party resources are currently not supported even tho the description say this  

*/
MuxJS.Deploy(MuxJS.Json())//Parse json data
MuxJS.Deploy(MuxJS.Cookies())//Parse incoming cookies
MuxJS.Deploy(MuxJS.XmlParser())//Parse xml data, NOTE: should only be used with simple xml
MuxJS.Deploy(MuxJS.FileUpload())//Parses binary data from files 
MuxJS.Deploy(MuxJS.UrlEncoded())//Parse urlencoded data
MuxJS.Deploy(MuxJS.MethodOverride())// Checks for the _method query string and changes the request method to either PUT or DELETE
MuxJS.Deploy(MuxJS.MultiPartFormData())//Parses Multipart form-data


//Initializes root router
const r = MuxJS.NewRouter();

//basic handler, home (function) triggers on path: '/' and method: 'GET'. 
r.HandleFunc('/', home).Method('GET')

//Middleware, functions that will be called before the actual handler, will trigger on any child sub route but never on any parent route
r.Use(middleware)

//Catch-all handler
r.NotFoundHandler(error)

//Initializes a sub router with /api as pathprefix
const r_api = r.SubRouter().PathPrefix('/api')

//Sub route handler, triggers on the path /api/book/{anything}/{anything}
r_api.HandleFunc('/book/{author}/{title}', jsondata).Method('GET')


//Initializes a nested sub route where the path will now be '/api/json'
const r_json = r_api.SubRouter().PathPrefix('/json')

//API catch-all handler (not technically needed)
r_api.NotFoundHandler(api_error)

//Initializes another sub router
const r_auth = r.SubRouter().PathPrefix('/auth')

r_auth.HandleFunc('/signout', signout).Method('GET')
r_auth.HandleFunc('/validate', validate).Method('GET')

//Auth catch-all handler (not technically needed)
r_auth.NotFoundHandler(auth_error)

//Initializes another sub router
const r_crud = r.SubRouter().PathPrefix('/crud')

//create middlewares
r_crud.Use(crudMiddleware1)
r_crud.Use(crudMiddleware2)


r_crud.HandleFunc('/read', read).Method('GET')
r_crud.HandleFunc('/create', create).Method('POST')
r_crud.HandleFunc('/update', update).Method('PUT')
r_crud.HandleFunc('/delete', del).Method('DELETE')

//Crud catch-all handler (not technically needed)
r_crud.NotFoundHandler(crud_error)