function show_hidePopUpWindow(thechosenone) {
    $('.menu').each(function(index) {
        if ($(this).attr("id") == thechosenone) {
            $(this).toggle();
        }
        else {
            $(this).hide(600);
        }
    });
}

function show_hidePopUpSearch(thechosenone) {
    $('.menu2').each(function(index) {
        if ($(this).attr("id") == thechosenone) {
            $(this).toggle();
        }
        else {
            $(this).hide(600);
        }
    });
}

function toggle2(element){
    if (element.style.display !== "none")
        element.style.display = "none";
    else element.style.display = "block";
}

