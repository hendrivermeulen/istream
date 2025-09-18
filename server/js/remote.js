let currentIndex = -1;
let lastIndex = 1;
let originalBorder;

function focusElement() {
    const elements = Array.from(document.querySelectorAll('a, input, button'));
    if (currentIndex < 0) {currentIndex = 0;}
    if (currentIndex > elements.length - 1) {currentIndex = elements.length - 1}

    elements[currentIndex].focus();
    originalBorder = elements[currentIndex].style.border
    elements[currentIndex].style.border = "3px solid red"

    elements[lastIndex].style.border = originalBorder;
    lastIndex = currentIndex;
}

function back(){

}

function up(){
    if(currentIndex > 9 && currentIndex < 15){
        currentIndex = 9;
    } else {
        if(currentIndex > 9){
            currentIndex -= 5
        }
    }
    focusElement()
}

function down(){
    if(currentIndex <= 9){
        currentIndex = 10;
    } else {
        currentIndex += 5
    }
    focusElement()
}

function left(){
    currentIndex--
    focusElement()
}

function right(){
    currentIndex++
    focusElement()
}

window.addEventListener("keydown", function(inEvent){
    if(window.event) {
        keycode = inEvent.keyCode;
    } else if(e.which) {
        keycode = inEvent.which;
    }
    switch (keycode) {
        case 461: back(); break;
        case 37: left(); break;
        case 38: up(); break;
        case 39: right(); break;
        case 40: down(); break;
        case 415: play(); break;
        case 19: pause(); break;
        case 406: fullscreen(); break;
    }
});