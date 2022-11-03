function substr(s, start = 1, end = -1) {
    if(!s) return s;
     
    return s.substring(start, (end > 0 ? end : s.length + end))
}

function pFloat(s) {
    if(!s) return s;
     
    return isNaN(s) ? s : parseFloat(s)
}

function undefinedObj(obj) {
    if(!obj) return undefined;


    return Object.keys(obj).length === 0
}



module.exports = { substr, pFloat, undefinedObj }