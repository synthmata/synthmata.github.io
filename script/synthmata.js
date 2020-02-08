(function(r){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=r()}else if(typeof define==="function"&&define.amd){define([],r)}else{var e;if(typeof window!=="undefined"){e=window}else if(typeof global!=="undefined"){e=global}else if(typeof self!=="undefined"){e=self}else{e=this}e.base64js=r()}})(function(){var r,e,t;return function r(e,t,n){function o(i,a){if(!t[i]){if(!e[i]){var u=typeof require=="function"&&require;if(!a&&u)return u(i,!0);if(f)return f(i,!0);var d=new Error("Cannot find module '"+i+"'");throw d.code="MODULE_NOT_FOUND",d}var c=t[i]={exports:{}};e[i][0].call(c.exports,function(r){var t=e[i][1][r];return o(t?t:r)},c,c.exports,r,e,t,n)}return t[i].exports}var f=typeof require=="function"&&require;for(var i=0;i<n.length;i++)o(n[i]);return o}({"/":[function(r,e,t){"use strict";t.byteLength=c;t.toByteArray=v;t.fromByteArray=s;var n=[];var o=[];var f=typeof Uint8Array!=="undefined"?Uint8Array:Array;var i="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";for(var a=0,u=i.length;a<u;++a){n[a]=i[a];o[i.charCodeAt(a)]=a}o["-".charCodeAt(0)]=62;o["_".charCodeAt(0)]=63;function d(r){var e=r.length;if(e%4>0){throw new Error("Invalid string. Length must be a multiple of 4")}return r[e-2]==="="?2:r[e-1]==="="?1:0}function c(r){return r.length*3/4-d(r)}function v(r){var e,t,n,i,a;var u=r.length;i=d(r);a=new f(u*3/4-i);t=i>0?u-4:u;var c=0;for(e=0;e<t;e+=4){n=o[r.charCodeAt(e)]<<18|o[r.charCodeAt(e+1)]<<12|o[r.charCodeAt(e+2)]<<6|o[r.charCodeAt(e+3)];a[c++]=n>>16&255;a[c++]=n>>8&255;a[c++]=n&255}if(i===2){n=o[r.charCodeAt(e)]<<2|o[r.charCodeAt(e+1)]>>4;a[c++]=n&255}else if(i===1){n=o[r.charCodeAt(e)]<<10|o[r.charCodeAt(e+1)]<<4|o[r.charCodeAt(e+2)]>>2;a[c++]=n>>8&255;a[c++]=n&255}return a}function l(r){return n[r>>18&63]+n[r>>12&63]+n[r>>6&63]+n[r&63]}function h(r,e,t){var n;var o=[];for(var f=e;f<t;f+=3){n=(r[f]<<16)+(r[f+1]<<8)+r[f+2];o.push(l(n))}return o.join("")}function s(r){var e;var t=r.length;var o=t%3;var f="";var i=[];var a=16383;for(var u=0,d=t-o;u<d;u+=a){i.push(h(r,u,u+a>d?d:u+a))}if(o===1){e=r[t-1];f+=n[e>>2];f+=n[e<<4&63];f+="=="}else if(o===2){e=(r[t-2]<<8)+r[t-1];f+=n[e>>10];f+=n[e>>4&63];f+=n[e<<2&63];f+="="}i.push(f);return i.join("")}},{}]},{},[])("/")});

var tempTitle = [115, 121, 110, 116, 104, 109, 97, 116, 97, 32];
var midi = null;  // global MIDIAccess object
var midiOutPorts = null;
var selectedMidiPort = null;
var selectedMidiChannel = null;
var isYamahaMode = false;

var sysexDumpData = null;  // we have to use this for Volca FM which only reponds to bulk data

var goodFile = null;

var sysexDumpThrottleTimer = null;
var sysexParamThrottleTimer = null;

var sysexDumpThrottleTimerMs = 300;
var sysexParamThrottleTimerMs = 30;

var patchLoadedEvent = new Event("synthmataPatchLoaded");

// TODO: better plan for this to have user of module put it in a hidden textbox?
var __init_patch__ = "8EMAAAEbUAAAUGMAAAAyAAAAAAAAAFwAAQAAUAAAUGMAAAAyAAAAAAAAAFwAAgAAUAAAUGMAAAAyAAAAAAAAAFwAAQAAUAAAT2MAAAAyAAAAAAAAAFwAAgAAUAAAUGMAAAAyAAAAAAAAAFwAAQAAUAAAUGMAAAAyAAAAAAAAAGMAAgAAMjIyMjIyMjIfAAAAAAAAAAAAGHN5bnRobWF0YSB/TPc=";

function loadInitPatch(){
    let patchRaw = base64js.toByteArray(__init_patch__);
    loadSysex(patchRaw,true)
}

function onMIDISuccess(result) {
    console.log("MIDI ready!");
    midi = result;
    storeOutputs(midi);
    if (midiOutPorts.length < 1) {
        onMIDIFailure("No midi ports found");
    }
    console.log(midiOutPorts);
    buildSetupPanel();
    buildSaveLoadSharePanel();
    setupParameterControls();
    fullRefreshSysexData(); // for Volca FM
    if(!loadSharablePatchLink(window.location)){
        loadInitPatch();
    }

    for (var input of midi.inputs.values()) {
      input.onmidimessage=onMidiMessage;
    }
}

function onMIDIFailure(msg) {
    alert("Could not get MIDI access.\nPlease note that MIDI in the browser currently only works in Chrome and Opera.\nIf you declined MIDI access when prompted, please refresh the page.")
    console.log("Failed to get MIDI access - " + msg);
}

function onMidiMessage(evt) {
    var data    = evt.data;
    if(data[0]!=0xF0)  return;  // only handle SYSEX messages
    var channel=data[2] & 0xf;
    if(channel != selectedMidiChannel) return;
    if(!validateSysexData(data)) return;
    loadSysex(data);
    console.log("SYSEX received!");
}

function testTone() {
    if (selectedMidiChannel != null && selectedMidiPort != null) {
        console.log("sending test tone");
        let noteOnMessage = [0x90 | selectedMidiChannel, 60, 0x7f];
        let noteOffMessage = [0x80 | selectedMidiChannel, 60, 0x7f];
        selectedMidiPort.send(noteOnMessage);
        selectedMidiPort.send(noteOffMessage, window.performance.now() + 1000.0);
    }
}

function buildSetupPanel(midiAccess) {
    // Port selection.
    let former = document.createElement("form");
    former.id = "midiSetupForm";
    
    let portSelectLabel = document.createElement("label");
    portSelectLabel.textContent = "Select MIDI Device";

    let portSelecter = document.createElement("select");
    portSelecter.id = "portSelector";
    portSelecter.onchange = function (event) { 
        selectedMidiPort = midiOutPorts[event.target.value]; 
        console.log(selectedMidiPort); 
        sendSysexDump();
        //testTone();   // this is interacting with the sysex change - need to address this longterm, because I think it's useful, but disabled for now
    };
    
    portSelectLabel.appendChild(portSelecter);
    former.appendChild(portSelectLabel);
    midiOutPorts.forEach(
        function (port, idx) {
            let optioner = document.createElement("option");
            optioner.setAttribute("label", port.name);
            optioner.setAttribute("value", idx);
            portSelecter.appendChild(optioner);
        }, this);
    selectedMidiPort = midiOutPorts; // TODO: check there's not a more idiomatic way of doing this

    // Channel selection
    let channelSelectLabel = document.createElement("label");
    channelSelectLabel.textContent = "Select MIDI Channel";

    let channelSelector = document.createElement("select");
    channelSelector.id = "channelSelector";
    channelSelector.onchange = function (event) { 
        selectedMidiChannel = parseInt(event.target.value); 
        console.log(selectedMidiChannel); 
        sendSysexDump();
        //testTone();  // this is interacting with the sysex change - need to address this longterm, because I think it's useful, but disabled for now
    };
    channelSelectLabel.appendChild(channelSelector);
    former.appendChild(channelSelectLabel);
    for (let i = 0; i < 16; i++) {
        let optioner = document.createElement("option");
        optioner.setAttribute("label", i + 1);
        optioner.setAttribute("value", i);
        channelSelector.appendChild(optioner);
    }
    selectedMidiChannel = 0;

    // Korg/Yamaha Switch
    let switchModes = function(e){ isYamahaMode = document.getElementById("modeYamaha").checked; sendSysexDump(); }

    let modeKorgRadioLabel = document.createElement("label");
    modeKorgRadioLabel.setAttribute("for", "modeKorg");
    modeKorgRadioLabel.textContent = "Korg Mode";
    let modeKorgRadioInput = document.createElement("input");
    modeKorgRadioInput.id = "modeKorg";
    modeKorgRadioInput.setAttribute("type", "radio");
    modeKorgRadioInput.setAttribute("name", "mode");
    modeKorgRadioInput.setAttribute("value", "korg");
    modeKorgRadioInput.checked = true;
    modeKorgRadioInput.addEventListener("change", switchModes);
    former.appendChild(modeKorgRadioLabel);
    former.appendChild(modeKorgRadioInput);
    
    let modeYamahaRadioLabel = document.createElement("label");
    modeYamahaRadioLabel.setAttribute("for", "modeYamaha");
    modeYamahaRadioLabel.textContent = "Yamaha Mode";
    let modeYamahaRadioInput = document.createElement("input");
    modeYamahaRadioInput.id = "modeYamaha";
    modeYamahaRadioInput.setAttribute("type", "radio");
    modeYamahaRadioInput.setAttribute("name", "mode");
    modeYamahaRadioInput.setAttribute("value", "yamaha");
    modeYamahaRadioInput.addEventListener("change", switchModes);
    former.appendChild(modeYamahaRadioLabel);
    former.appendChild(modeYamahaRadioInput);
    
    document.getElementById("deviceChannel").appendChild(former);
}

function buildSaveLoadSharePanel() {
    let container = document.getElementById("saveLoadShare");

    let loadInput = document.createElement("input");
    loadInput.setAttribute("type", "file");
    loadInput.id = "sysexFileChooser"
    loadInput.onchange = checkSysexFileLoad;
    container.appendChild(loadInput);

    let loadButton = document.createElement("button");
    loadButton.id = "sysexLoadButton";
    loadButton.textContent = "Load Sysex";
    loadButton.setAttribute("disabled", true);
    loadButton.onclick = tryLoadSysex;
    container.appendChild(loadButton);

    let saveButton = document.createElement("button");
    saveButton.id = "sysexSaveButton";
    saveButton.textContent = "Save Sysex";
    saveButton.onclick = saveSysex;
    container.appendChild(saveButton); 

    let initPatchButton = document.createElement("button");
    initPatchButton.id = "initPatchButton";
    initPatchButton.textContent = "Init Patch";
    initPatchButton.onclick = function(){
        loadInitPatch();
    }
    container.appendChild(initPatchButton);

    let sharableLinkTextbox = document.createElement("textarea");
    sharableLinkTextbox.id = "sharableLinkTextbox";
    sharableLinkTextbox.setAttribute("readonly", true);
    
    let createSharableLinkButton = document.createElement("button");
    createSharableLinkButton.id = "createSharableLinkButton";
    createSharableLinkButton.textContent = "Create Sharable Patch Link";
    createSharableLinkButton.onclick = function(){
        sharableLinkTextbox.value = createSharablePatchLink();
    }

    container.appendChild(createSharableLinkButton);
    container.appendChild(sharableLinkTextbox);
}

function setupParameterControls() {
    for (let sysexControl of document.getElementsByClassName("sysexParameter")) {
        sysexControl.oninput = handleValueChange;
    }
    for (let sysexControl of document.getElementsByClassName("sysexParameterText")) {
        sysexControl.oninput = handleValueChange;
    }
    for(let sysexControl of document.getElementsByClassName("sysexParameterBitswitch")) {
        sysexControl.onchange = handleValueChange; // usually checkboxes and they don't have oninputs
    }
}

function fullRefreshSysexData() {
    sysexDumpData = new Array(156); // TODO: probably don't hard code this?
    sysexDumpData.fill(0);
    for (let ele of document.getElementsByClassName("sysexParameter")) {
        let parameterNo = parseInt(ele.dataset.sysexparameterno);
        let value = parseInt(ele.value);

        sysexDumpData[parameterNo] = value & 0x7f;
    }
    
    let bitSwitchControls = new Array(...document.getElementsByClassName("sysexParameterBitswitch"));
    bitSwitchControls.forEach(function(element){
        let mask = parseInt(element.dataset.sysexparameterbitmask);
        let switched = element.type == "checkbox" || element.type == "radio" ? element.checked : element.value != 0;
        let parameterNo = parseInt(element.dataset.sysexparameterno);

        if(switched){
            sysexDumpData[parameterNo] |= (0xff & mask)
        }else{
            sysexDumpData[parameterNo] &= ~(0xff & mask)
        }

    });

    let textControls = new Array(...document.getElementsByClassName("sysexParameterText"));
    textControls.forEach(function(element){
        let parameterNo = parseInt(element.dataset.sysexparameterno);
        let stringLength = parseInt(element.dataset.sysextextlength);
        let value = element.value.toString();
        for(let i = 0; i < stringLength; i++){
            if(i < value.length){
                let ordinal = value.charCodeAt(i);
                if(ordinal <= 0x20 || ordinal >= 0x7f){
                    ordinal = 0x3f; // ?
                }
                sysexDumpData[i + parameterNo] = ordinal;
            }else{
                sysexDumpData[i + parameterNo] = 0x20;
            }
        }
    });
    console.log(sysexDumpData);
}

function handleValueChange(event){
    if(isYamahaMode){
        handleParamValueChange(event);
    }else{
        handleValueChangeVoiceDump(event);
    }
}

// On the Yamaha synths we can send invididual parameters, but we will still maintain
// our patch array for convenience...
function sendParameterChange(paramNumber, value){
    let paramChangeMessage = [
        0xf0,                         // status byte (sysex)
        0x43,                           // id number (Yamaha)
        0x10 | selectedMidiChannel,   // sub status 0b0001_nnnn; n is channel
        0x00 | (paramNumber >> 7),    // 0b0ggg_ggpp ; g is paramater group no. (0 = voice); p is (part of) paramater number
        paramNumber & 0x7f,           // 0b0ppp_pppp ; rest of parameter number
        value & 0x7f,                 // 0b0ddd_dddd ; value data
        0xf7                          // 0b1111_0111 ; EOX
    ];

    //console.log(paramChangeMessage);
    selectedMidiPort.send(paramChangeMessage);
}

function handleParamValueChange(event) {
    if (selectedMidiChannel != null && selectedMidiPort != null) {
        let ele = event.target;
        let sysexBuffer = sysexDumpData;
        if (event.target.classList.contains("sysexParameter")) {
            let parameterNo = parseInt(ele.dataset.sysexparameterno);
            let value = parseInt(ele.value);
            sysexBuffer[parameterNo] = value & 0x7f;
            
            // throttle these changes so we don't overflow the buffer on the
            // synth. if we were being very paranoid, we'd put in a safegaurd
            // to always send the last value of any session of value changes
            // on a control before moving to another, but that seems a lot like
            // solving an issue before we know it can exist. Something to 
            // consider if we get lost parameter changes though.
            if (sysexParamThrottleTimer != null) {
                clearTimeout(sysexParamThrottleTimer);
            }

            sysexParamThrottleTimer = setTimeout(function () {
                sendParameterChange(parameterNo, value);
            }, sysexParamThrottleTimerMs);
        }else if (event.target.classList.contains("sysexParameterText")){
            let parameterNo = parseInt(ele.dataset.sysexparameterno);
            let stringLength = parseInt(ele.dataset.sysextextlength);
            let value = ele.value.toString();
            
            for(let i = 0; i < stringLength; i++){
                if(i < value.length){
                    let ordinal = value.charCodeAt(i);
                    if(ordinal < 0x20 || ordinal >= 0x7f){
                        ordinal = 0x3f; // ?
                    }
                    sysexBuffer[i + parameterNo] = ordinal;
                    sendParameterChange(i + parameterNo, ordinal)
                }else{
                    sysexBuffer[i + parameterNo] = 0x20;
                    sendParameterChange(i + parameterNo, 0x20)
                }
            }
        }else if(event.target.classList.contains("sysexParameterBitswitch")){
            let parameterNo = parseInt(ele.dataset.sysexparameterno);
            let mask = parseInt(ele.dataset.sysexparameterbitmask) & 0x7f;
            let value = ele.value;
            if(ele.type == "checkbox" || ele.type == "radio"){
                value = ele.checked
            }
            if(value){
                //console.log(ele.value)
                sysexBuffer[parameterNo] |= mask;
            }else{
                //console.log(ele.value)
                sysexBuffer[parameterNo] &= ~mask;
            }
            sendParameterChange(parameterNo, sysexBuffer[parameterNo]);
        }
    }
}

function createSysexDumpBuffer() {
    // checksum is a byte which is the twos complement of the sum of the
    // dump data, masked back against 0x7f
    // if i want to micro-optimise this, I can. I don't really want to though.
    
    // This accounts for the non-standard behaviour of the Volca requiring the op on/off switches in the dump
    let dumpLength = isYamahaMode ? (sysexDumpData.length - 1 ) : sysexDumpData.length;
    
    let sum = 0;
    for (let i = 0; i < dumpLength; i++) {
        sum += sysexDumpData[i];
    }
    sum &= 0xff;
    sum = (~sum) + 1;
    sum &= 0x7f;

    let buffer = [
        0xF0,                         // status - start sysex
        0x43,                         // id - yamaha (67)
        0x00 | selectedMidiChannel,   // 0b0sssnnnn substatus (0), channel (n)
        0x00,                         // format number (0 = 1 voice)
        0x01,                         // 0b0bbbbbbb data byte count msb
        0x1b,                         // 0b0bbbbbbb data byte count lsb
        ...(sysexDumpData.slice(0, dumpLength)),
        sum,                          // checksum
        0xf7                          // 0b1111_0111 ; EOX
    ];

    //console.log(buffer);
    return buffer;
}

// volca fm only responds to bulk voice messages, so this version works
// but the handleValueChange doesn't.
function handleValueChangeVoiceDump(event) {
    if (selectedMidiChannel != null && selectedMidiPort != null) {
        let ele = event.target;
        if (event.target.classList.contains("sysexParameter")) {
            let parameterNo = parseInt(ele.dataset.sysexparameterno);
            let value = parseInt(ele.value);

            sysexDumpData[parameterNo] = value & 0x7f;
            //sendSysexDump()
        }else if (event.target.classList.contains("sysexParameterText")){
            let parameterNo = parseInt(ele.dataset.sysexparameterno);
            let stringLength = parseInt(ele.dataset.sysextextlength);
            let value = ele.value.toString();
            
            for(let i = 0; i < stringLength; i++){
                if(i < value.length){
                    let ordinal = value.charCodeAt(i);
                    if(ordinal <= 0x20 || ordinal >= 0x7f){
                        ordinal = 0x3f; // ?
                    }
                    sysexDumpData[i + parameterNo] = ordinal;
                }else{
                    sysexDumpData[i + parameterNo] = 0x20;
                }
            }
        }else if(event.target.classList.contains("sysexParameterBitswitch")){
            let parameterNo = parseInt(ele.dataset.sysexparameterno);
            let mask = parseInt(ele.dataset.sysexparameterbitmask) & 0x7f;
            let value = ele.value;
            if(ele.type == "checkbox" || ele.type == "radio"){
                value = ele.checked
            }
            if(value){
                console.log(ele.value)
                sysexDumpData[parameterNo] |= mask;
            }else{
                console.log(ele.value)
                sysexDumpData[parameterNo] &= ~mask;
            }
        }
        sendSysexDump()
    }
}

function sendSysexDump() {
    let buffer = createSysexDumpBuffer();
    console.log(buffer);

    if (sysexDumpThrottleTimer != null) {
        clearTimeout(sysexDumpThrottleTimer);
    }
    sysexDumpThrottleTimer = setTimeout(function () {
        selectedMidiPort.send(buffer);
    }, sysexDumpThrottleTimerMs);
    
}

function saveSysex() {
    let fullDump = createSysexDumpBuffer();
    let buffer = new Uint8ClampedArray(new ArrayBuffer(fullDump.length));
    for (let i = 0; i < fullDump.length; i++) {
        buffer[i] = fullDump[i];
    }

    var file = new Blob([buffer], { type: "application/octet-binary" });
    let a = document.createElement("a");
    let url = URL.createObjectURL(file);
    a.href = url;
    a.download = "dx7_patch.sysex";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);
}

function validateSysexData(data) {
    if (data.length < 163 || data.length > 164) {  // accept DX7 or Volca format
        console.log("wrong length");
        return false;  // wrong length
    }
    if (data[0] != 0xF0) {
        console.log("doesn't start with sysex byte");
        return false; // doesn't start with sysex byte
    }
    if (data[1] != 0x43) {
        console.log("not a yamaha sysex");
        return false; // not a yamaha sysex
    }

    let endOfData = data.length == 164 ? 162 : 161;

    if (data[endOfData + 1] != 0xf7) {
        console.log("doesn't end with EOX");
        return false; // doesn't end with EOX
    }
    if ((data[2] & 0x70) != 0) {
        console.log("sub status is not correct:");
        return false; // sub status is not correct
    }
    if (data[3] != 0) {
        console.log("format isn't voice");
        return false; // format isn't voice
    }
    if (data[4] != 0x01 || data[5] != 0x1b) {
        console.log("length indicator is not correct");
        return false; // length indicator is not correct
    }
    
    // checksum check
    let sum = 0;
    for (let i = 6; i < endOfData; i++) {
        sum += data[i];
    }
    sum &= 0xff;
    sum = (~sum) + 1;
    sum &= 0x7f;
    if (sum != data[endOfData]) {
        console.log("checksum failed");
        return false; // checksum failed
    }

    return true;
}

function checkSysexFileLoad(event) {
    let fileList = event.target.files;
    if (fileList.length > 0) {
        let theFile = fileList[0];
        console.log(theFile);
        let reader = new FileReader();
        reader.onload = function (e) {
            let data = new Uint8ClampedArray(e.target.result);
            console.log(data);
            if (validateSysexData(data)) {
                alert("File appears to contain valid sysex data");
                document.getElementById("sysexLoadButton").removeAttribute("disabled");
                goodFile = theFile;
            } else {
                alert("File is not valid sysex data");
                document.getElementById("sysexLoadButton").setAttribute("disabled", true);
                goodFile = null;
            }
        }
        reader.readAsArrayBuffer(theFile);
    }
}

function loadSysex(sysexData,sendSysex) {
    
    if(sysexData.byteLength == 163){  // account for DX7 dumps with no OP On-Off data
        // NB, this CAN'T be the proper way to do this, but I'll be damned if I can get
        // ArrayBuffer and friends to behave the way I wanted. Weird times, strange bugs.
       
        let tmp = [];
        new Uint8ClampedArray(sysexData).forEach(x => tmp.push(x));
        tmp.splice(161, 0, 0x3f); // hedge by just turning everything on
        sysexData = tmp;
    }
    let data = new Uint8ClampedArray(sysexData);
    let paramArray = data.slice(6, 162);

    // numeric perameters
    let paramControls = new Array(...document.getElementsByClassName("sysexParameter"));
    paramControls.forEach(function (element) { element.value = paramArray[element.dataset.sysexparameterno]; });
    
    // text paramenters
    let textControls = new Array(...document.getElementsByClassName("sysexParameterText"));
    textControls.forEach(function(element){
        let startOffset = parseInt(element.dataset.sysexparameterno);
        let textLength = parseInt(element.dataset.sysextextlength);
        let chararray = [];
        for(let i = 0; i < textLength; i++){
            chararray.push(String.fromCharCode(paramArray[i + startOffset]))
        }
        
        element.value = chararray.join("");
    });

    let bitSwitchControls = new Array(...document.getElementsByClassName("sysexParameterBitswitch"));
    bitSwitchControls.forEach(function(element){
        let mask = parseInt(element.dataset.sysexparameterbitmask);
        let switched = (paramArray[element.dataset.sysexparameterno] & mask) != 0;
        if(element.type == "checkbox" || element.type == "radio"){
            element.checked = switched;
        }else{
            element.value = mask; // TODO: mask? or the switched bool?
        }
    });
    sysexDumpData = paramArray;
    if(sendSysex) sendSysexDump();
    window.dispatchEvent(patchLoadedEvent);
}

function tryLoadSysex(event) {
    if (goodFile == null) {
        alert("Please select a sysex file to load");
        return;
    }
    let reader = new FileReader();
    reader.onload = function(e){ loadSysex(e.target.result,true);};
    reader.readAsArrayBuffer(goodFile);
}

function createSharablePatchLink(){
    let tmpMode = isYamahaMode;
    isYamahaMode = false;
    let patchAsB64 = base64js.fromByteArray(createSysexDumpBuffer());
    isYamahaMode = tmpMode;
    // abusing dom to parse the current url
    var parser = document.createElement('a');
    parser.href = window.location;
    return parser.origin + parser.pathname + "?p=" + encodeURIComponent(patchAsB64);
}

function loadSharablePatchLink(url){
    // abusing dom to parse the current url
    var parser = document.createElement('a');
    parser.href = window.location;
    let queryString = parser.search;
    var searchParams = new URLSearchParams(queryString);
    if(!searchParams.has("p")){
        return false;
    }
    let patchAsB64 = searchParams.get("p");
    let patchRaw = base64js.toByteArray(patchAsB64);
    if(!validateSysexData(patchRaw)){
        return false;
    }
    loadSysex(patchRaw,true);
    return true;
}

function storeOutputs(midiAccess) {
    midiOutPorts = new Array(...midiAccess.outputs.values());
}

navigator.requestMIDIAccess({ sysex: true }).then(onMIDISuccess, onMIDIFailure);
