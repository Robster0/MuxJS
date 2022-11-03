const path = require('path')
const fs = require('fs')

let htmlhead = (values) => `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/static/css/style.css">
            ${values}
            <title>Read</title>
        </head>
        <body>
        `

function read(w, r) {
    const dbPath = path.join(__dirname, '../db.json')

    const buffer = fs.readFileSync(dbPath)
    let data = JSON.parse(buffer)

    let html = `
    ${htmlhead('')}
        <div class="${data.length === 0 ? 'content' : 'posts'}">
    `

    for(let i = 0; i<data.length; i++)
    {
         html += `
            <div class="post">
              <h1>${data[i].name}</h1>
              <p>${data[i].desc}</p>
              <img src="${data[i].path}" alt="" width="200px" height="200px">
              <a href="/crud/read/${data[i].id}">View</a>
            </div>
         `
    }


    data.length === 0 && (html += '<h1>No posts</h1>')
    

    html += `
    </div>
    </body>
    </html>`


    w.Cookie('test', 'epic value', {HttpOnly: true, Secure: true, Path: '/crud/read'})

    

    w.Send(html)

}

function readOne(w, r) {
    const dbPath = path.join(__dirname, '../db.json')

    const buffer = fs.readFileSync(dbPath)
    let posts = JSON.parse(buffer)
    let post = null

    for(let i = 0; i<posts.length; i++)
    {
        if(posts[i].id != r.Params.id) continue;
        
        
        post = posts[i]
    }

    if(!post) return w.Redirect('/error')  

    let html = `
    ${htmlhead(`<script src="https://kit.fontawesome.com/75aa1d4d81.js" crossorigin="anonymous" defer></script>
    <script src="/static/client.js" defer></script>`)}
            <div class="posts">
                <div class="post" style="margin-top: 100px;">
                    <h1>${post.name}</h1>
                    <p>${post.desc}</p>
                    <img src="${post.path}" alt="" width="300px" height="300px">
                    <div style="display: flex; gap: 10px;">
                        <a title="open update form" id="update" style="color: white; height: 20px; z-index: 2;">Update</a>
                        <a href="/crud/delete?id=${post.id}&_method=DELETE" title="delete this post" id="delete" style="color: white; height: 20px; z-index: 2;"><i class="fa-solid fa-trash-can"></i></a>
                    </div>
                </div>

                <form action="/crud/update?id=${post.id}&_method=PUT" class="form hide" style="margin-top: 100px;" method="post" enctype="multipart/form-data">
                    <input type="text" name="name" placeholder="name">
                    <textarea name="desc" id="desc" cols="20" rows="10" placeholder="description"></textarea>
                    <input type="file" name="image" id="file">
                <input type="submit" value="Submit">
             </form>
            </div>
        </body>
        </html>
    `

    w.Send(html)
}

function create_GET(w, r) {

    w.SendFile(path.join(__dirname, '../html/create.html'))
}

function create_POST(w, r) {

    console.log(r)

    let extension = r.Files.image.name.split('.')

    const dbPath = path.join(__dirname, '../db.json')

    let filename = `/static/assets/image_${Date.now()}.${extension[extension.length - 1]}`

    const imagePath = path.join(__dirname, '..' + filename) 
    
    const buffer = fs.readFileSync(dbPath)

    let data = JSON.parse(buffer)

    r.Body['id'] = Date.now()
    r.Body['path'] = filename
    

    data.push(r.Body)

    fs.writeFileSync(imagePath, r.Files.image.data)
    fs.writeFileSync(dbPath, JSON.stringify(data))

    w.Redirect('/')
}


function update(w, r) {

    console.log(r)

    if(Object.keys(r.Files).length < 1) return w.Redirect('/error')

    let extension = r.Files.image.name.split('.')

    const dbPath = path.join(__dirname, '../db.json')
    let filepath = `/static/assets/image_${Date.now()}.${extension[extension.length - 1]}`
    
    const buffer = fs.readFileSync(dbPath)

    let posts = JSON.parse(buffer)


    for(let i = 0; i<posts.length; i++)
    {
        if(posts[i].id !== r.Query.id) continue;

        const oldpath = path.join(__dirname, '..' + posts[i].path)
        if(fs.existsSync(oldpath))
            fs.unlinkSync(oldpath)

        posts[i].name = r.Body.name
        posts[i].desc = r.Body.desc
        posts[i].path = filepath
    }

    fs.writeFile(path.join(__dirname, '..' + filepath), r.Files.image.data, (err) => {
        if(err) return console.log(err);

        fs.writeFile(dbPath, JSON.stringify(posts), (err) => {
             if(err) return console.log(err)

             w.Redirect(r.Headers.Referer.split(r.Headers.Origin)[1])
        })

    })
}

function del(w, r) {

    console.log(r)
    const dbPath = path.join(__dirname, '../db.json')
    const buffer = fs.readFileSync(dbPath)

    let posts = JSON.parse(buffer)


    let newPosts = []

    for(let i = 0; i<posts.length; i++)
    {
        if(posts[i].id === r.Query.id) {
            const oldpath = path.join(__dirname, '..' + posts[i].path)
            if(fs.existsSync(oldpath))
                fs.unlinkSync(oldpath)

            continue;
        }

        newPosts.push(posts[i])
    }

    fs.writeFile(dbPath, JSON.stringify(newPosts), (err) => {
        if(err) return console.log(err)

        w.Redirect('/crud/read')
   })
}


module.exports = { read, readOne, create_GET, create_POST, update, del }