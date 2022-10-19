//<i class="fa-solid fa-xmark"></i>
let mode = true



document.getElementById('update').addEventListener('click', (e) => {
    console.log("CLICKED")


    document.getElementById('update').innerHTML = mode ? '<i class="fa-solid fa-xmark fa-2x" title="close update form"></i>' : 'Update'
    
    if(mode) document.querySelector('.form').classList.remove('hide')
    else document.querySelector('.form').classList.add('hide')

    mode = mode ? false : true;
})