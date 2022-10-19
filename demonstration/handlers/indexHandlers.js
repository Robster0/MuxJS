const path = require('path')
function home(w, r) {

    w.SendFile(path.join(__dirname, '../html/home.html'))
}



function error(w, r) {
    
    w.SendFile(path.join(__dirname, '../html/error.html'))
}


module.exports = { home, error }



