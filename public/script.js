(function () {
    console.log("script.js hooked up");

    var c = $("canvas");
    var ctx = c[0].getContext("2d");
    var todata = c[0].toDataURL("text");
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

    console.log("c[0].toDataURL();", c[0].toDataURL("text"));

    $("button").on("click", () => {
        $("#signatureInput").val(todata);
        console.log('$("#signatureInput").val', $("#signatureInput").val());
    });
    console.log("todata", todata);
})();
