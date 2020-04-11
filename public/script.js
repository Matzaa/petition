(function () {
    console.log("script.js hooked up");

    var c = $("canvas");
    var ctx = $("canvas")[0].getContext("2d");

    var pressed = false;
    var lastX;
    var lastY;

    c.mousedown(function (e) {
        pressed = true;
        sign(e.pageX - c.offset().left, e.pageY - c.offset().top, false);
    });

    c.mousemove(function (e) {
        if (pressed) {
            sign(e.pageX - c.offset().left, e.pageY - c.offset().top, true);
        }
    });

    c.mouseup(function () {
        pressed = false;
    });

    function sign(x, y, isDown) {
        if (isDown) {
            console.log("isDown", isDown);
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            ctx.closePath();
            ctx.stroke();
        }
        lastX = x;
        lastY = y;
    }
})();
