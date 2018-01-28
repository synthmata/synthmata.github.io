DISPLAY_BACK = "#5b6d2a";
DISPLAY_LIGHT = "#b3d41d"
DISPLAY_DIM = "#83b400";

function makeEnvelope(attackEle, dec1rateEle, dec1LevelEle, dec2RateEle, releaseRateEle, canvas){
    let envInputs = {
        "attack" : attackEle,
        "decay1Rate" : dec1rateEle,
        "decay1Level" : dec1LevelEle,
        "decay2Rate" : dec2RateEle,
        "releaseRate" : releaseRateEle
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
        let maxStepWidth = canvasWidth * 3;// - 2 * easeInWidth;
        
        // just to clean things up below...
        let attack = ((1 + parseInt(envInputs.attack.value)) / 32.0) * 100;
        let decay1Rate = ((1 + parseInt(envInputs.decay1Rate.value)) / 32.0) * 100;
        let decay2Rate = ((1 + parseInt(envInputs.decay2Rate.value)) / 32.0) * 100;
        let releaseRate = ((1 + parseInt(envInputs.releaseRate.value)) / 16.0) * 100;
        let decay1Level = ((parseInt(envInputs.decay1Level.value)) / 16.0) * 100;
        let isSustain = envInputs.decay2Rate.value == 0;

        // calculate final width so we can apply scaling if needed:
        let stepOneX = ((100 / attack) * maxStepWidth) / 100;
        let stepTwoX = (((100 - decay1Level) / decay1Rate) * maxStepWidth) / 100;
        let decay2StepX = 0
        if(!isSustain){
            decay2StepX = ((decay1Level / decay2Rate) * maxStepWidth) / 100; 
        }
        let releaseStepX = ((decay1Level / releaseRate) * maxStepWidth) / 100; 

        //let finalWidth = easeInWidth * 2 + stepOneX + stepTwoX + stepThreeX + stepFourX;
        let finalWidth = stepOneX + stepTwoX + Math.max(decay2StepX, releaseStepX);
        easeInWidth = finalWidth / 10;
        finalWidth += easeInWidth * (isSustain ? 4 : 2);
        let scale = finalWidth / canvasWidth; 

        let ctx = canvas.getContext("2d");
        //reset transform matrix ahead of any work
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = DISPLAY_BACK;
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
        ctx.strokeStyle = DISPLAY_LIGHT;

        let x = 0;
        // EASE IN
        ctx.beginPath();

        ctx.moveTo(x, baseLine);
        x += easeInWidth;
        ctx.lineTo(x, baseLine);
        ctx.strokeStyle = DISPLAY_DIM;
        ctx.stroke();
        
        // Attack
        ctx.beginPath();
        ctx.moveTo(x, baseLine);
        x += stepOneX;
        ctx.lineTo(x, baseLine - envHeight);

        // Decay 1
        x += stepTwoX;
        ctx.lineTo(x, baseLine - (decay1Level * envHeight) / 100);
        ctx.strokeStyle = DISPLAY_LIGHT;
        ctx.stroke();
        
        // SUSTAIN
        ctx.beginPath();
        ctx.moveTo(x, baseLine - (decay1Level * envHeight) / 100);
        if(isSustain){
            x += easeInWidth * 2;
            ctx.lineTo(x, baseLine - (decay1Level * envHeight) / 100);
            ctx.strokeStyle = DISPLAY_DIM;
            ctx.stroke();
        }

        let descentStartX = x;
        let descentStartY = baseLine - (decay1Level * envHeight) / 100;

        // Release
        ctx.beginPath();
        ctx.beginPath();
        ctx.moveTo(descentStartX, descentStartY);
        ctx.lineTo(descentStartX + releaseStepX, baseLine);
        ctx.strokeStyle = DISPLAY_DIM;
        ctx.stroke();

        // Decay2 (if not sustained)
        if(!isSustain){
            ctx.beginPath();
            ctx.moveTo(descentStartX, descentStartY);
            ctx.lineTo(descentStartX + decay2StepX, baseLine);
            ctx.strokeStyle = DISPLAY_LIGHT;
            ctx.stroke();
        }

        x += Math.max(decay2StepX, releaseStepX);

        // Ease out
        ctx.beginPath();
        ctx.moveTo(x, baseLine);
        x += easeInWidth;
        ctx.lineTo(x, baseLine);
        ctx.strokeStyle = DISPLAY_DIM;
        ctx.stroke();

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        // draw text information
        let scaleText = "x" + ((stepOneX + stepTwoX + Math.max(decay2StepX, releaseStepX))/canvasWidth).toLocaleString(undefined, {"maximumFractionDigits": 3});
        ctx.fillStyle = DISPLAY_LIGHT;
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