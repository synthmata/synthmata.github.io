function makeLFO(canvas, shapeSlider, frequencySlider){

    let update = function(){
        let canvasHeight = canvas.height;
        let canvasWidth = canvas.width;
        let paddingH = 20
        let paddingV = 10
        let sustainWidth = paddingH * 2
        let baseLine = canvasHeight -1//- paddingV
        let envHeight = canvasHeight - paddingV * 2
        let envWidth = canvasWidth - paddingH * 2
        let gridLineCount = 5

        let shape = parseInt(shapeSlider.value)
        let freq = parseInt(frequencySlider.value)

        let pi = Math.PI
        let pt = Math.PI*2
        let ph = Math.PI/2

        function arcctg(x) { return Math.PI / 2 - Math.atan(x) }


        let gf = [
            (x,f)   => Math.asin(sin(x,f,ph))/ph,                // triangle wave
            (x,f)   => -(ph-arcctg(Math.tan((pi+(x*pi))*f)))/ph,   // sawtooth UP
            (x,f)   =>  (ph-arcctg(Math.tan((pi+(x*pi))*f)))/ph,   // sawtooth DOWN
            (x,f)   => Math.sign(sin(x,f,ph)),                   // square wave
            (x,f,p) => Math.sin((p+(x*pt))*f),                    // sine wave
            (x,f)   => sin(Math.round(x*16)/16,f,ph),                // sample and hold
        ]

        // let fy = (x,f) => Math.sin((x/canvasWidth)*Math.PI*2*f)
        let fy = gf[shape]//(x,f) => Math.sin((x/canvasWidth)*Math.PI*2*f)
        let sin = gf[4]

        // DRAW EVERYTHING

        let ctx = canvas.getContext("2d");

        // CLEAR CANVAS
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        ctx.translate(0.5,0.5) // prevents blury lines

        // DRAW HORIZONTAL GRID LINES
        ctx.lineWidth   = 1
        ctx.strokeStyle = "rgba(210, 235, 215, 0.15)"

        let stepy = (canvasHeight-1) / (gridLineCount-1)

        for(let i=0; i<gridLineCount;i++){
            let y = Math.ceil(stepy * i)
            ctx.beginPath()
            ctx.moveTo(0, y)
            ctx.lineTo(canvasWidth, y)
            ctx.stroke()
        }

        // DRAW WAVEFORM
        let y = canvasHeight/2
        let a = y * 0.8 // amplitude
        let p = -0.5 // phase
        let f = (Math.ceil(freq/10)) | 1
        // ctx.strokeStyle = "rgba(210, 235, 215, 0.35)"
        // ctx.beginPath()
        // ctx.moveTo(0, y-0.5)
        // ctx.lineTo(canvasWidth, y-0.5)
        // ctx.stroke()
// console.log(f)
        ctx.beginPath()
        ctx.strokeStyle = "rgba(250, 235, 215, 0.65)"
        ctx.moveTo(0, y + fy(0, f, p) * a)
        let steps = canvasWidth * 2
        for(let x=0; x<steps; x+=0.5){
            let w = x/(canvasWidth-1)
            ctx.lineTo(x, y + fy(w, f, p) * a)
        }
        ctx.stroke()


        // DRAW LINE
        // x = 0;

        // ctx.lineWidth = 1.5
        // ctx.strokeStyle = "rgba(250, 235, 215, 0.65)"
        // ctx.lineCap     = "round"
        // ctx.lineJoin    = "round"

        // // EASE IN
        // ctx.beginPath();
        // ctx.moveTo(x, fy(l4))
        // ctx.lineTo(x+= paddingH, fy(l4))
        // // MAIN ENV PT.1
        // ctx.lineTo(x+= stepOneX, fy(l1))
        // ctx.lineTo(x+= stepTwoX, fy(l2))
        // ctx.lineTo(x+= stepThreeX, fy(l3))
        // // SUSTAIN
        // ctx.lineTo(x+= sustainWidth, fy(l3))
        // // MAIN ENV PT.2
        // ctx.lineTo(x+= stepFourX, fy(l4))
        // // EASE OUT
        // ctx.lineTo(x+= paddingH, fy(l4))
        // ctx.stroke();

        // DRAW TEXT
        // let scaleText = val
        // ctx.fillStyle = "tan";
        // ctx.font = "12px 'Montserrat', cursive"
        // ctx.textBaseline = "top";

        // ctx.fillText(scaleText, canvasWidth - ctx.measureText(scaleText).width, 4)

        ctx.translate(-0.5,-0.5) // reset blury pixel offset
    }

    shapeSlider.addEventListener("input", update)
    frequencySlider.addEventListener("input", update)

    update();
    return update;
}
