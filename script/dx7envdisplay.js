function makeEnvelope(r1Ele, r2Ele, r3Ele, r4Ele, l1Ele, l2Ele, l3Ele, l4Ele, canvas){
    let envInputs = {
        "r1" : r1Ele,
        "r2" : r2Ele,
        "r3" : r3Ele,
        "r4" : r4Ele,
        "l1" : l1Ele,
        "l2" : l2Ele,
        "l3" : l3Ele,
        "l4" : l4Ele
    };

    let update = function(){
        let canvasHeight = canvas.height;
        let canvasWidth = canvas.width;
        let paddingH = 20
        let paddingV = 10
        let sustainWidth = paddingH * 2
        let baseLine = canvasHeight -1//- paddingV
        let envHeight = canvasHeight - paddingV * 2
        let envWidth = canvasWidth - paddingH * 2
        let gridLineCount = 4

        // just to clean things up below...
        let r1 = parseInt(envInputs.r1.value)
        let r2 = parseInt(envInputs.r2.value)
        let r3 = parseInt(envInputs.r3.value)
        let r4 = parseInt(envInputs.r4.value)
        let l1 = parseInt(envInputs.l1.value)
        let l2 = parseInt(envInputs.l2.value)
        let l3 = parseInt(envInputs.l3.value)
        let l4 = parseInt(envInputs.l4.value)

        let stepOneX = ((Math.abs(l4 - l1) / (r1 + 1)) * envWidth) / 100
        let stepTwoX = ((Math.abs(l1 - l2) / (r2 + 1)) * envWidth) / 100
        let stepThreeX = ((Math.abs(l2 - l3) / (r3 + 1)) * envWidth) / 100
        let stepFourX = ((Math.abs(l3 - l4) / (r4 + 1)) * envWidth) / 100

        let finalWidth = stepOneX + stepTwoX + stepThreeX + stepFourX

        let scale = (finalWidth + sustainWidth) / envWidth

        stepOneX /= scale
        stepTwoX /= scale
        stepThreeX /= scale
        stepFourX /= scale
        sustainWidth /= scale


        // utility function
        let fy = y => baseLine - (y * envHeight) / 100

        // DRAW EVERYTHING

        let ctx = canvas.getContext("2d");

        ctx.translate(0.5,0.5) // prevents blury lines


        // CLEAR CANVAS
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // DRAW HORIZONTAL GRID LINES
        ctx.lineWidth   = 1
        ctx.strokeStyle = "rgba(210, 180, 140, 0.25)"

        for(let i=0; i<=gridLineCount;i++){
            let y = ((envHeight / (gridLineCount-1)) * i) - (i==(gridLineCount) ? 1 : 0)//+ paddingH
            ctx.beginPath()
            ctx.moveTo(0, y)
            ctx.lineTo(canvasWidth, y)
            ctx.stroke()
        }

        // DRAW FILL
        let x = 0;

        ctx.fillStyle = 'rgba(120, 212, 206, 0.5)'
        ctx.beginPath()
        ctx.moveTo(x, fy(l4))
        ctx.lineTo(x+= paddingH, fy(l4))
        // MAIN ENV PT.1
        ctx.lineTo(x+= stepOneX, fy(l1))
        ctx.lineTo(x+= stepTwoX, fy(l2))
        ctx.lineTo(x+= stepThreeX, fy(l3))
        // SUSTAIN
        ctx.lineTo(x+= sustainWidth, fy(l3))
        // MAIN ENV PT.2
        ctx.lineTo(x+= stepFourX, fy(l4))
        // EASE OUT
        ctx.lineTo(x+= paddingH, fy(l4))
        // ENVELOPE
        ctx.lineTo(x, canvasHeight)
        ctx.lineTo(0, canvasHeight)
        ctx.closePath();
        ctx.fill();

        // DRAW LINE
        x = 0;

        ctx.lineWidth = 1.5
        ctx.strokeStyle = "rgba(250, 235, 215, 0.65)"
        ctx.lineCap     = "round"
        ctx.lineJoin    = "round"

        // EASE IN
        ctx.beginPath();
        ctx.moveTo(x, fy(l4))
        ctx.lineTo(x+= paddingH, fy(l4))
        // MAIN ENV PT.1
        ctx.lineTo(x+= stepOneX, fy(l1))
        ctx.lineTo(x+= stepTwoX, fy(l2))
        ctx.lineTo(x+= stepThreeX, fy(l3))
        // SUSTAIN
        ctx.lineTo(x+= sustainWidth, fy(l3))
        // MAIN ENV PT.2
        ctx.lineTo(x+= stepFourX, fy(l4))
        // EASE OUT
        ctx.lineTo(x+= paddingH, fy(l4))
        ctx.stroke();

        // DRAW TEXT
        let scaleText = (finalWidth/envWidth).toLocaleString(undefined, {"maximumFractionDigits": 3});
        ctx.fillStyle = "tan";
        ctx.font = "12px 'Montserrat', cursive"
        ctx.textBaseline = "top";

        ctx.fillText(scaleText, canvasWidth - ctx.measureText(scaleText).width, 4)

        ctx.translate(-0.5,-0.5) // reset blury pixel offset
    }

    for(let prop in envInputs){
        envInputs[prop].addEventListener("input", update)
    }

    update();
    return update;
}
