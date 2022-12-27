//First handler created
function home(w, r) {

    w.Send(`<h1>Home</h1>`)
}


//API handlers
function jsondata(w, r) {

    //Path example for reference: /api/book/robster0/BookTitle?page=90

    //get params
    const author = r.Params.author
    const title = r.Params.title

    //Get queries
    const page = r.Query['page']

    //use the params and queries to get data from example a database 

    w.SendJSON({})//sends json data, status code is by default 200
}


//Auth handlers
function signout(w, r) {

    w.ClearCookie('token')


    w.SendStatus(200)
}

function validate(w, r) {

    const token = r.Cookies['token']//Token created from crud subroute


    //Validate token


    //if success (might be better to send some data instead)
    w.SendStatus(200)
}



//Crud handlers
function read(w, r) {
     
    //read stuff

    w.Send(``)
}
function create(w, r) {

    //create stuff

    w.Cookie('token', 'token value here', {HttpOnly: true, Secure: true, SameSite: 'Lax', ExpiresIn: 1000 * 60 * 60})
    
    w.Status(201).SendJSON({})
}
function update(w, r) {
    //update stuff


    w.SendStatus(200)
}
function del(w, r) {
    //delete stuff

    w.SendStatus(200)
}


//Middlewares. Contrary to the standard 2 parameters, middleware functions takes in 3 (w, r, next)
function middleware(w, r, next) {
    //Stops the next middleware from getting called
    if(error === true) return;


    //Do something cool here...


    //Calls the next middleware/handler
    next.Serve(w, r)
}

//Will only get called if the url path begins with '/crud' (since these middlewares was initialized on a subroute that has '/crud' as a pathprefix)
function crudMiddleware1(w, r, next) {

    next.Serve(w, r)
}
function crudMiddleware2(w, r, next) {
    
    next.Serve(w, r)
}

//NotFoundHandlers. Triggers on every path except on handlers that contain that path or if a child NotFoundHandler could be triggered
function error(w, r) {
    w.SendStatus(404)
}

function api_error(w, r) {
    w.SendStatus(404)
}

function auth_error(w, r) {
    w.SendStatus(404)
}

function crud_error(w, r) {
    w.SendStatus(404)
}
