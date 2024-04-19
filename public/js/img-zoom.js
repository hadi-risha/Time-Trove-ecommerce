
var mainImg = document.querySelector('.main-img');
var lens = document.getElementById('lens');

function moveLens(event) {
    var imgRect = mainImg.getBoundingClientRect();
    var x = event.clientX - imgRect.left;
    var y = event.clientY - imgRect.top;

    var lensX = x - lens.offsetWidth / 2;
    var lensY = y - lens.offsetHeight / 2;

    lens.style.left = lensX + 'px';
    lens.style.top = lensY + 'px';
    lens.style.backgroundImage = 'url("' + mainImg.src + '")';
    lens.style.backgroundPosition = '-' + (x * 4 - lens.offsetWidth / 2) + 'px -' + (y * 4 - lens.offsetHeight / 2) + 'px';
    lens.style.display = 'block'; // make the lens visible
}

function hideLens() {
    lens.style.display = 'none'; // hide the lens
}

function changeMainImage(src) {
    // swap src between main image and clicked sub-image
    var tempSrc = mainImg.src;
    mainImg.src = src;

    // trigger moveLens to zoom the new main image
    var event = new Event('mousemove');
    moveLens(event);

    // swap background image of lens with the swapped images
    lens.style.backgroundImage = 'url("' + tempSrc + '")';
}