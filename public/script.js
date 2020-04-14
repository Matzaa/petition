(function () {
    console.log("script.js hooked up");

    var c = $("canvas");
    var ctx = c[0].getContext("2d");
    var dataURL;
    var pressed = false;
    var lastX;
    var lastY;

    c.on("mousedown", (e) => {
        pressed = true;
        sign(e.pageX - c.offset().left, e.pageY - c.offset().top, false);
    });

    c.on("mousemove", (e) => {
        if (pressed) {
            sign(e.pageX - c.offset().left, e.pageY - c.offset().top, true);
        }
    });

    c.on("mouseup", function () {
        pressed = false;
        dataURL = c[0].toDataURL("text");
        $("#signatureInput").val(dataURL);
    });

    function sign(x, y, isDown) {
        if (isDown) {
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
