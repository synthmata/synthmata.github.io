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

    // resize canvas
    let canvasParentStyle = getComputedStyle(canvas.parentElement);
    var parentWidth = parseInt(canvasParentStyle.width, 10);
    var parentHeight = parseInt(canvasParentStyle.height, 10);
    canvas.width = parseInt(canvasParentStyle.width, 10) - parseInt(canvasParentStyle.paddingLeft, 10) - parseInt(canvasParentStyle.paddingRight, 10);
    canvas.height = parseInt(canvasParentStyle.height, 10) - parseInt(canvasParentStyle.paddingBottom, 10) - parseInt(canvasParentStyle.paddingBottom, 10);
    // recalculate to allow for nudging the layout with the canvas
    canvasParentStyle = getComputedStyle(canvas.parentElement);
    parentWidth = parseInt(canvasParentStyle.width, 10);
    parentHeight = parseInt(canvasParentStyle.height, 10);

    let checkResizeCanvas = function(timestamp){
        canvasParentStyle = getComputedStyle(canvas.parentElement);
        let currentParentWidth = parseInt(canvasParentStyle.width, 10);
        let currentParentHeight = parseInt(canvasParentStyle.height, 10);
        if(parentWidth != currentParentWidth){
            console.log("width");
            canvas.width = parseInt(canvasParentStyle.width, 10) - parseInt(canvasParentStyle.paddingLeft, 10) - parseInt(canvasParentStyle.paddingRight, 10);
            canvasParentStyle = getComputedStyle(canvas.parentElement);
            parentWidth = parseInt(canvasParentStyle.width, 10);
            update();
        }
        if(parentHeight != currentParentHeight){
            console.log("height");
            canvas.height = parseInt(canvasParentStyle.height, 10) - parseInt(canvasParentStyle.paddingBottom, 10) - parseInt(canvasParentStyle.paddingBottom, 10);
            canvasParentStyle = getComputedStyle(canvas.parentElement);
            parentHeight = parseInt(canvasParentStyle.height, 10);
            update()
        }
        window.requestAnimationFrame(checkResizeCanvas);
    }

    
    
    let update = function(){
        let canvasHeight = canvas.height;
        let canvasWidth = canvas.width;
        let baseLine = canvasHeight - canvasHeight / 10;
        let envHeight = canvasHeight * 0.8;
        let easeInWidth = canvasWidth / 10;
        let maxStepWidth = canvasWidth - 2 * easeInWidth;
        
        // just to clean things up below...
        let r1 = parseInt(envInputs.r1.value);
        let r2 = parseInt(envInputs.r2.value);
        let r3 = parseInt(envInputs.r3.value);
        let r4 = parseInt(envInputs.r4.value);
        let l1 = parseInt(envInputs.l1.value);
        let l2 = parseInt(envInputs.l2.value);
        let l3 = parseInt(envInputs.l3.value);
        let l4 = parseInt(envInputs.l4.value);
        // TODO: should convert the values from the l's and r's into percentages (they are already, but, like it doesn't feel good)

        // calculate final width so we can apply scaling if needed:
        let stepOneX = ((Math.abs(l4 - l1) / (r1 + 1)) * maxStepWidth) / 100;
        let stepTwoX = ((Math.abs(l1 - l2) / (r2 + 1)) * maxStepWidth) / 100;
        let stepThreeX = ((Math.abs(l2 - l3) / (r3 + 1)) * maxStepWidth) / 100; 
        let stepFourX = ((Math.abs(l3 - l4) / (r4 + 1)) * maxStepWidth) / 100;

        //let finalWidth = easeInWidth * 2 + stepOneX + stepTwoX + stepThreeX + stepFourX;
        let finalWidth = stepOneX + stepTwoX + stepThreeX + stepFourX;
        easeInWidth = finalWidth / 10;
        finalWidth += easeInWidth * 4;
        let scale = finalWidth / canvasWidth; 

        let ctx = canvas.getContext("2d");
        //reset transform matrix ahead of any work
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = "#444444";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        // set scale if required to fit
        
        /*
        if(scale > 1){
            ctx.scale(1/scale, 1);
        }
        */
        ctx.scale(1/scale, 1);
        
        ctx.lineWidth = 5 * scale;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "rgb(41, 163, 67)";

        let x = 0;
        // EASE IN
        ctx.beginPath();

        ctx.moveTo(x, baseLine - (l4 * envHeight) / 100);
        x += easeInWidth;
        ctx.lineTo(x, baseLine - (l4 * envHeight) / 100);
        ctx.strokeStyle = "rgb(27, 110, 44)";
        ctx.stroke();
        
        // MAIN ENV PT.1
        ctx.beginPath();
        ctx.moveTo(x, baseLine - (l4 * envHeight) / 100);
        x += stepOneX
        ctx.lineTo(x, baseLine - (l1 * envHeight) / 100);
        x += stepTwoX;
        ctx.lineTo(x, baseLine - (l2 * envHeight) / 100);
        x += stepThreeX;
        ctx.lineTo(x, baseLine - (l3 * envHeight) / 100);
        ctx.strokeStyle = "rgb(41, 163, 67)";
        ctx.stroke();
        
        // SUSTAIN
        ctx.beginPath();
        ctx.moveTo(x, baseLine - (l3 * envHeight) / 100);
        x += easeInWidth * 2;
        ctx.lineTo(x, baseLine - (l3 * envHeight) / 100);
        ctx.strokeStyle = "rgb(27, 110, 44)";
        ctx.stroke();

        // MAIN ENV PT.2
        ctx.beginPath();
        ctx.moveTo(x, baseLine - (l3 * envHeight) / 100);
        x += stepFourX;
        ctx.lineTo(x, baseLine - (l4 * envHeight) / 100);
        
        ctx.strokeStyle = "rgb(41, 163, 67)";
        ctx.stroke();
        
        // EASE OUT
        ctx.beginPath();
        ctx.moveTo(x, baseLine - (l4 * envHeight) / 100);
        x += easeInWidth;
        ctx.lineTo(x, baseLine - (l4 * envHeight) / 100);
        ctx.strokeStyle = "rgb(27, 110, 44)";
        ctx.stroke();
        
        //ctx.lineWidth = 5;
        //ctx.lineWidth = 5 * scale;
        //ctx.lineCap = "round";
        //ctx.lineJoin = "round";
        //ctx.strokeStyle = "rgb(41, 163, 67)";
        //ctx.stroke();

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        // draw text information
        //let scaleText = "x" + (scale > 1 ? scale.toLocaleString(undefined, {"maximumFractionDigits": 3}) : "1");
        let scaleText = "x" + ((stepOneX + stepTwoX + stepThreeX + stepFourX)/canvasWidth).toLocaleString(undefined, {"maximumFractionDigits": 3});
        ctx.fillStyle = "rgb(41, 163, 67)";
        ctx.font = "16px 'Press Start 2P', cursive"
        ctx.textBaseline = "top";
        
        ctx.fillText(scaleText, canvasWidth - ctx.measureText(scaleText).width - 10, 0)
    }

    for(let prop in envInputs){
        envInputs[prop].addEventListener("input", function(event) {update();});
    }

    // Hook resizing of canvas to animation frame because that should be way lower maintanence than trying to do it on a timer tick
    // (this gets reassigned inside that function, as is required)
    window.requestAnimationFrame(checkResizeCanvas);

    update();
    return update;
}