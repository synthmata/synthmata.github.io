//base64js
(function(r){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=r()}else if(typeof define==="function"&&define.amd){define([],r)}else{var e;if(typeof window!=="undefined"){e=window}else if(typeof global!=="undefined"){e=global}else if(typeof self!=="undefined"){e=self}else{e=this}e.base64js=r()}})(function(){var r,e,t;return function r(e,t,n){function o(i,a){if(!t[i]){if(!e[i]){var u=typeof require=="function"&&require;if(!a&&u)return u(i,!0);if(f)return f(i,!0);var d=new Error("Cannot find module '"+i+"'");throw d.code="MODULE_NOT_FOUND",d}var c=t[i]={exports:{}};e[i][0].call(c.exports,function(r){var t=e[i][1][r];return o(t?t:r)},c,c.exports,r,e,t,n)}return t[i].exports}var f=typeof require=="function"&&require;for(var i=0;i<n.length;i++)o(n[i]);return o}({"/":[function(r,e,t){"use strict";t.byteLength=c;t.toByteArray=v;t.fromByteArray=s;var n=[];var o=[];var f=typeof Uint8Array!=="undefined"?Uint8Array:Array;var i="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";for(var a=0,u=i.length;a<u;++a){n[a]=i[a];o[i.charCodeAt(a)]=a}o["-".charCodeAt(0)]=62;o["_".charCodeAt(0)]=63;function d(r){var e=r.length;if(e%4>0){throw new Error("Invalid string. Length must be a multiple of 4")}return r[e-2]==="="?2:r[e-1]==="="?1:0}function c(r){return r.length*3/4-d(r)}function v(r){var e,t,n,i,a;var u=r.length;i=d(r);a=new f(u*3/4-i);t=i>0?u-4:u;var c=0;for(e=0;e<t;e+=4){n=o[r.charCodeAt(e)]<<18|o[r.charCodeAt(e+1)]<<12|o[r.charCodeAt(e+2)]<<6|o[r.charCodeAt(e+3)];a[c++]=n>>16&255;a[c++]=n>>8&255;a[c++]=n&255}if(i===2){n=o[r.charCodeAt(e)]<<2|o[r.charCodeAt(e+1)]>>4;a[c++]=n&255}else if(i===1){n=o[r.charCodeAt(e)]<<10|o[r.charCodeAt(e+1)]<<4|o[r.charCodeAt(e+2)]>>2;a[c++]=n>>8&255;a[c++]=n&255}return a}function l(r){return n[r>>18&63]+n[r>>12&63]+n[r>>6&63]+n[r&63]}function h(r,e,t){var n;var o=[];for(var f=e;f<t;f+=3){n=(r[f]<<16)+(r[f+1]<<8)+r[f+2];o.push(l(n))}return o.join("")}function s(r){var e;var t=r.length;var o=t%3;var f="";var i=[];var a=16383;for(var u=0,d=t-o;u<d;u+=a){i.push(h(r,u,u+a>d?d:u+a))}if(o===1){e=r[t-1];f+=n[e>>2];f+=n[e<<4&63];f+="=="}else if(o===2){e=(r[t-2]<<8)+r[t-1];f+=n[e>>10];f+=n[e>>4&63];f+=n[e<<2&63];f+="="}i.push(f);return i.join("")}},{}]},{},[])("/")});

var patchSelectionChangeEvent = new Event("synthmataPatchSelectionChanged");

var __comms_protocol__ = 7; // as of 1.1.0 of the DeepMind firmware this (7) was what was being sent. 1.1.2 is the same.

var __midi__ = null;
var __outputs__ = [];
var __inputs__ = [];

var __patches__ = [];

function countSelectedPatches(){
    let tmp = 0;
    if(document.getElementById("patchmanager_patchlist") == null){
        return 0;
    }
    for(let check of document.getElementById("patchmanager_patchlist").getElementsByClassName("patchmanager_patchcheckbox")){
        if(check.checked){
            tmp += 1;
        }
    }
    return tmp;
}

// I'm going to return to this later - it's not really essential, but it's
// a nice to have. I'm just not 100% on how best to implement it was all of the
// async stuff going on.
/*
function autoDetectDeepmind(){
    let detectedOutput = null;
    function testDeepMindResponse(midiEvent){
        console.log(midiEvent);
        let d = midiEvent.data;
        if(
            d.length == 17 &&
            d[0] == 0xf0 &&  // sysex
            d[1] == 0x7e &&  // non-real time
            // d[2] is device ID
            d[3] == 0x06 &&  // general information
            d[4] == 0x02 &&  // identity reply
            d[5] == 0x00 &&  // behringer (1 of 3)
            d[6] == 0x20 &&  // behringer (2 of 3)
            d[7] == 0x32 &&  // behringer (3 of 3)
            d[8] == 0x20 &&  // deepmind (1 of 4)
            d[9] == 0x00 &&  // deepmind (2 of 4)
            d[10] == 0x01 && // deepmind (3 of 4)
            d[11] == 0x00 && // deepmind (4 of 4)
            d[16] == 0xf7    // eosysex
        ){
            detectedOutput = midiEvent.target;
            console.log(detectedOutput);
        }
    }
    __inputs__.forEach(x => x.onmidimessage = testDeepMindResponse);
    let helloMessage = [0xf0, 0x7e, 0x7f, 0x06, 0x01, 0xf7];
    for(let outport of __outputs__){
        outport.send(helloMessage);
        //
    }
}
*/


function isIdentityResponse(data){
    let d = data;
    return (d.length == 17 &&
        d[0] == 0xf0 &&  // sysex
        d[1] == 0x7e &&  // non-real time
        // d[2] is device ID
        d[3] == 0x06 &&  // general information
        d[4] == 0x02 &&  // identity reply
        d[5] == 0x00 &&  // behringer (1 of 3)
        d[6] == 0x20 &&  // behringer (2 of 3)
        d[7] == 0x32 &&  // behringer (3 of 3)
        d[8] == 0x20 &&  // deepmind (1 of 4)
        d[9] == 0x00 &&  // deepmind (2 of 4)
        d[10] == 0x01 && // deepmind (3 of 4)
        d[11] == 0x00 && // deepmind (4 of 4)
        d[16] == 0xf7    // eosysexS
    );
}

function getInPort(){
    return __inputs__[parseInt(document.getElementById("patchmanager_portinselector").value)];
}

function getOutPort(){
    return __outputs__[parseInt(document.getElementById("patchmanager_portoutselector").value)];
}

async function testConnection(){
    let inport = getInPort();
    let outport = getOutPort();

    let success = false;
    inport.onmidimessage = x => { 
        if(!success){ success = x.target == inport && isIdentityResponse(x.data);} 
    }

    let helloMessage = [0xf0, 0x7e, 0x7f, 0x06, 0x01, 0xf7];
    outport.send(helloMessage);
    return new Promise(resolve => {setTimeout(() => {resolve(success);}, 3000)});
}

function makeMidiPanel(){
    let midiPanelContainer = document.createElement("div");
    midiPanelContainer.id = "patchmanager_midisetupcontainer";
    midiPanelContainer.classList.add("patchmanager_panel");

    let stepHeader = document.createElement("h2");
    stepHeader.textContent = "Step 3:";
    midiPanelContainer.appendChild(stepHeader);
    let stepInfo = document.createElement("h3");
    stepInfo.textContent = "Select the MIDI device for your DeepMind synthesizer.";
    midiPanelContainer.appendChild(stepInfo);
    
    let portInSelectLabel = document.createElement("label");
    portInSelectLabel.id = "patchmanager_portinselectorlabel";
    portInSelectLabel.textContent = "Select Input MIDI Device: ";
    portInSelectLabel.setAttribute("for", "patchmanager_portinselector");

    let portInSelecter = document.createElement("select");
    portInSelecter.id = "patchmanager_portinselector";

    __inputs__.forEach(
        function (port, idx) {
            let optioner = document.createElement("option");
            optioner.setAttribute("label", port.name);
            optioner.setAttribute("value", idx);
            portInSelecter.appendChild(optioner);
        }, this);

    midiPanelContainer.appendChild(portInSelectLabel);
    midiPanelContainer.appendChild(portInSelecter);
    midiPanelContainer.appendChild(document.createElement("br")); // TODO: would this be better dealt with in the stylesheet?

    let portOutSelectLabel = document.createElement("label");
    portOutSelectLabel.id = "patchmanager_portoutselectorlabel"
    portOutSelectLabel.textContent = "Select Output MIDI Device: ";
    portOutSelectLabel.setAttribute("for", "patchmanager_portoutselector");

    let portOutSelecter = document.createElement("select");
    portOutSelecter.id = "patchmanager_portoutselector";

    __outputs__.forEach(
        function (port, idx) {
            let optioner = document.createElement("option");
            optioner.setAttribute("label", port.name);
            optioner.setAttribute("value", idx);
            portOutSelecter.appendChild(optioner);
        }, this);

    midiPanelContainer.appendChild(portOutSelectLabel);
    midiPanelContainer.appendChild(portOutSelecter);
    midiPanelContainer.appendChild(document.createElement("br")); // TODO: would this be better dealt with in the stylesheet?

    let testConnectionSpan = document.createElement("span");
    testConnectionSpan.id = "patchmanager_portTestStatusSpan";
    
    let testConnectionButton = document.createElement("button");
    testConnectionButton.id = "patchmanager_portTestStatusButton";
    testConnectionButton.textContent = "Test Connection";
    testConnectionButton.addEventListener("click", x =>
        {
            testConnectionSpan.textContent = "Checking connection...";
            portInSelecter.setAttribute("disabled", null);
            portOutSelecter.setAttribute("disabled", null);
            testConnectionButton.setAttribute("disabled", null);
            testConnection().then(
                result => {
                    testConnectionSpan.textContent = result ? "Connection Confirmed" : "Connection Failed - please select different MIDI devices";
                    portInSelecter.removeAttribute("disabled");
                    portOutSelecter.removeAttribute("disabled");
                    testConnectionButton.removeAttribute("disabled");
                }
            );
        }
    );

    portInSelecter.addEventListener("change", x => testConnectionSpan.textContent = "");
    portOutSelecter.addEventListener("change", x => testConnectionSpan.textContent = "");

    midiPanelContainer.appendChild(testConnectionButton);
    midiPanelContainer.appendChild(testConnectionSpan);

    return midiPanelContainer;
}

function populatePatchlist(patchlistDiv, patches){
    for(let patchName in patches){
        let label = document.createElement("label");
        label.id = "patchLabel_" + patchName;
        label.classList.add("patchmanager_patchlabel");
        
        let checkbox = document.createElement("input");
        checkbox.id = "patchCheckbox_" + patchName;
        checkbox.classList.add("patchmanager_patchcheckbox");
        checkbox.setAttribute("type", "checkbox");
        checkbox.addEventListener("change", x =>  window.dispatchEvent(patchSelectionChangeEvent));
        checkbox.value = patchName;

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(patchName.replace(new RegExp(" ", "g"), "\u00a0")));

        patchlistDiv.appendChild(label);
    }
}

function makePatchList(patches){
    let patchListContainer = document.createElement("div");
    patchListContainer.id = "patchmanager_patchlistcontainer";
    patchListContainer.classList.add("patchmanager_panel");

    let stepHeader = document.createElement("h2");
    stepHeader.textContent = "Step 1:";
    patchListContainer.appendChild(stepHeader);
    let stepInfo = document.createElement("h3");
    stepInfo.textContent = "Select your patches.";
    patchListContainer.appendChild(stepInfo);
    
    let patchList = document.createElement("div");
    patchList.id = "patchmanager_patchlist";
    populatePatchlist(patchList, patches);
    patchListContainer.appendChild(patchList);

    let selectAllButton = document.createElement("button");
    let selectNoneButton = document.createElement("button");
    selectAllButton.id = "patchmanager_patchlistselectall";
    selectNoneButton.id = "patchmanager_patchlistselectnone";
    selectAllButton.classList.add("patchmanager_patchlistbutton");
    selectNoneButton.classList.add("patchmanager_patchlistbutton");
    selectAllButton.textContent = "Select All";
    selectNoneButton.textContent = "Select None";
    selectAllButton.addEventListener("click", x => {
        for(let check of document.getElementById("patchmanager_patchlist").getElementsByClassName("patchmanager_patchcheckbox")){
            check.checked = true;
        }
        window.dispatchEvent(patchSelectionChangeEvent);
    });
    selectNoneButton.addEventListener("click", x => {
        for(let check of document.getElementById("patchmanager_patchlist").getElementsByClassName("patchmanager_patchcheckbox")){
            check.checked = false;
        }
        window.dispatchEvent(patchSelectionChangeEvent);
    });

    patchListContainer.appendChild(selectAllButton);
    patchListContainer.appendChild(selectNoneButton);

    return patchListContainer;
}

function makeWriteLocationConatainer(){
    let writeLocationContainer = document.createElement("div");
    writeLocationContainer.id = "patchmanager_writelocationcontainer";
    writeLocationContainer.classList.add("patchmanager_panel");

    let stepHeader = document.createElement("h2");
    stepHeader.textContent = "Step 2:";
    writeLocationContainer.appendChild(stepHeader);
    let stepInfo = document.createElement("h3");
    stepInfo.textContent = "Choose where to store them.";
    writeLocationContainer.appendChild(stepInfo);
    
    let bankSelecterLabel = document.createElement("label");
    bankSelecterLabel.setAttribute("for", "patchmanager_writelocationbankselecter");
    bankSelecterLabel.textContent = "Bank: ";
    writeLocationContainer.appendChild(bankSelecterLabel);

    let bankSelecter = document.createElement("select");
    bankSelecter.id = "patchmanager_writelocationbankselecter";

    let i = 0;
    ["A", "B", "C", "D", "E", "F", "G", "H"].forEach(x => { 
        let op = document.createElement("option"); 
        op.value = i; op.textContent = x; 
        i++; 
        bankSelecter.appendChild(op);});
    writeLocationContainer.appendChild(bankSelecter);

    let numberSelecterLabel = document.createElement("label");
    numberSelecterLabel.setAttribute("for", "patchmanager_writelocationpatchnumber");
    numberSelecterLabel.textContent = "First Patch: ";
    

    let numberSelector = document.createElement("input");
    numberSelector.id = "patchmanager_writelocationpatchnumber";
    numberSelector.setAttribute("type", "number");
    numberSelector.setAttribute("min", 1);
    numberSelector.setAttribute("max", 129 - countSelectedPatches());
    numberSelector.value = 1;

    let lastPatchTextboxLabel = document.createElement("label");
    lastPatchTextboxLabel.setAttribute("for", "patchmanager_writelocationpatchnumberend");
    lastPatchTextboxLabel.textContent = "Last Patch: "

    let lastPatchTextbox = document.createElement("input");
    lastPatchTextbox.id = "patchmanager_writelocationpatchnumberend"
    lastPatchTextbox.setAttribute("type", "text");
    lastPatchTextbox.setAttribute("readonly", null);
    lastPatchTextbox.value = "N/A";

    window.addEventListener("synthmataPatchSelectionChanged", x => {
        let selectedCount = countSelectedPatches();
        let newMax = 129 - selectedCount;
        numberSelector.setAttribute("max", newMax);
        if(parseInt(numberSelector.value) > newMax){
            numberSelector.value = newMax;
        }
        lastPatchTextbox.value = selectedCount > 0 ? parseInt(numberSelector.value) + selectedCount - 1 : "N/A";
    });
    numberSelector.addEventListener("input", x => {
        let selectedCount = countSelectedPatches(); 
        lastPatchTextbox.value = selectedCount > 0 ? parseInt(numberSelector.value) + selectedCount - 1 : "N/A";
    });

    writeLocationContainer.appendChild(numberSelecterLabel);
    writeLocationContainer.appendChild(numberSelector);
    writeLocationContainer.appendChild(lastPatchTextboxLabel);
    writeLocationContainer.appendChild(lastPatchTextbox);

    return writeLocationContainer;
}

function isProgramDumpResponse(data){
    let d = data;
    return (
        d.length == 291 &&
        d[0] == 0xf0 &&    // sysex
        d[1] == 0x00 &&    // behringer (1 of 3)
        d[2] == 0x20 &&    // behringer (2 of 3)
        d[3] == 0x32 &&    // behringer (3 of 3)
        d[4] == 0x20 &&    // deepmind 
        d[5] == 0x00 &&    // device id 1 (user has to set this to 1 on thier unit)
        d[6] == 0x02 &&    // dump response
        //d[7] == 0x06 &&    // comms protocol  need to look into this more. my unit (as of today sends 7 not 6)
        d[290] == 0xf7     // eosysex
    );
}

function generateBackup(){
    let bank = parseInt(document.getElementById("patchmanager_writelocationbankselecter").value);
    let patchCount = countSelectedPatches();
    let firstPatch = parseInt(document.getElementById("patchmanager_writelocationpatchnumber").value) - 1;
    let lastPatch = firstPatch + patchCount - 1;

    let backupRequestMessage = [
        0xf0,                // sysex
        0x00,                // behringer (1 of 3)
        0x20,                // behringer (2 of 3)
        0x32,                // behringer (3 of 3)
        0x20,                // deepmind
        0x00,                // device-id (user must set unit to 1)
        0x09,                // bank dump req
        bank & 0x7f,
        firstPatch & 0x7f,
        lastPatch & 0x7f,
        0xf7                 // eosysex
    ];

    let messages = [];
    let inport = getInPort();
    let outport = getOutPort();

    inport.onmidimessage = x =>{
        if(x.target == inport && isProgramDumpResponse(x.data)){
            messages.push(x.data);
        }
    }

    outport.send(backupRequestMessage);
    
    return new Promise((resolve, reject)=>{
        // we use the timeout to timeout and reject; the interval to 
        // periodically check whether we have the full data (in which case
        // we resolve)
        let timeout = setTimeout(x => {reject("timeout")}, 10000);
        let interval = setInterval(x => {
            if(messages.length == patchCount){
                clearTimeout(timeout);
                clearInterval(interval);
                let totalLength = messages.reduce(((acc, cur) => acc + cur.length), 0);
                let buffer = new Uint8Array(totalLength);
                let i = 0;
                for(let patch of messages){
                    buffer.set(patch, i);
                    i += patch.length;
                }
                resolve(buffer);
            }
        }, 500);
    })
}

function makeBackupPanel(){
    let backupContainer = document.createElement("div");
    backupContainer.id = "patchmanager_backupcontainer";
    backupContainer.classList.add("patchmanager_panel");

    let stepHeader = document.createElement("h2");
    stepHeader.textContent = "Step 4:";
    backupContainer.appendChild(stepHeader);
    let stepInfo = document.createElement("h3");
    stepInfo.textContent = "Back-up your patches.";
    backupContainer.appendChild(stepInfo);

    let backupExplainP = document.createElement("p");
    backupExplainP.id = "patchmanager_backupparagraph"
    backupExplainP.textContent = "Sending these patches to your DeepMind (whether from within this " +
                                 "interface or by making use of the generated sysex files) will " +
                                 "overwrite the patches in the locations you have chosen. Once " +
                                 "these patches are overwritten, they cannot be recovered without " +
                                 "a backup. If you wish to backup the patches on your DeepMind, " +
                                 "clicking the button below will backup your patches in the " + 
                                 "locations specified. Save the generated file somewhere safe.";

    backupContainer.appendChild(backupExplainP);

    let backupButton = document.createElement("button");
    backupButton.id = "patchmanager_backupbutton";
    backupButton.textContent = "Backup My Patches";
    backupButton.addEventListener("click", x => {
        backupButton.setAttribute("disabled", null)
        let bank = "ABCDEFGH"[document.getElementById("patchmanager_writelocationbankselecter").value];
        let firstPatchNo = document.getElementById("patchmanager_writelocationpatchnumber").value;
        let lastPatchNo = firstPatchNo - 1 + countSelectedPatches();
        generateBackup().then(
            data => { 
                let file = new Blob([data], { type: "application/octet-binary" });
                let a = document.createElement("a");
                let url = URL.createObjectURL(file);
                a.href = url;
                a.download = `deepmind_backup_${bank}_${firstPatchNo}-${lastPatchNo}_${new Date(Date.now()).toISOString()}.sysex`
                document.body.appendChild(a);
                a.click();
                setTimeout(function () {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                }, 0);
            },
            fail => {alert("Backup process timed out.\nDo you have the correct MIDI devices selected (try the 'Test Connection' button)?\nIs your DeepMind set as Device ID 1 in the Global menu?");}
        ).then(r => backupButton.removeAttribute("disabled", null));
    });

    backupContainer.appendChild(backupButton);
    
    return backupContainer;
}

function makePatchPack(){
    // (this is long-hand for debugging, could be optimised. probably doesn't need to be)

    let bank = parseInt(document.getElementById("patchmanager_writelocationbankselecter").value);
    let firstPatch = parseInt(document.getElementById("patchmanager_writelocationpatchnumber").value) - 1;
    
    let checkedPatches = [];

    for(let check of document.getElementById("patchmanager_patchlist").getElementsByClassName("patchmanager_patchcheckbox")){
        if(check.checked){
            checkedPatches.push(__patches__[check.value]);
        }
    }
    
    let patcheDatas = [];
    let i = 0;
    for(let b64Patch of checkedPatches){
        let msg = [
            0xf0,            // sysex
            0x00,            // behringer (1 of 3)
            0x20,            // behringer (2 of 3)
            0x32,            // behringer (3 of 3)
            0x20,            // deepmind
            0x00,            // device id 1 (user needs to set device id to 1)
            0x02,            // program dump
            __comms_protocol__ & 0x7f, // comms protocol
            bank & 0x7f,     // bank
            firstPatch + i,  // program no
            ...base64js.toByteArray(b64Patch),
            0xf7             // eosysex
        ];
        patcheDatas.push(msg);
        i += 1;
    }

    let totalLength = patcheDatas.reduce(((acc, cur) => acc + cur.length), 0);
    let buffer = new Uint8Array(totalLength);
    i = 0;
    for(let patch of patcheDatas){
        buffer.set(patch, i);
        i += patch.length;
    }
    return {
        "buffer": buffer, 
        "bank": bank, 
        "firstPatch": firstPatch, 
        "patchCount": patcheDatas.length
    };
}

function makeGoPanel(){
    let goContainer = document.createElement("div");
    goContainer.id = "patchmanager_gocontainer";
    goContainer.classList.add("patchmanager_panel");

    let stepHeader = document.createElement("h2");
    stepHeader.textContent = "Step 5:";
    goContainer.appendChild(stepHeader);
    let stepInfo = document.createElement("h3");
    stepInfo.textContent = "Send or download your patches";
    goContainer.appendChild(stepInfo);

    let downloadButton = document.createElement("button");
    downloadButton.id = "patchmanager_downloadpatchesbutton";
    downloadButton.textContent = "Download Patch Pack";
    downloadButton.addEventListener("click", x => {
        let patchPack = makePatchPack();
        let warning = `Please note: sending this patch pack to your DeepMind will overwrite the ` +
                      `patches currently in bank ${"ABCDEFGH"[patchPack.bank]}, programs ${patchPack.firstPatch + 1} ` +
                      `to ${patchPack.firstPatch + patchPack.patchCount}.\n\nAre you happy to continue?`;
        if(confirm(warning)){
            let file = new Blob([patchPack.buffer], { type: "application/octet-binary" });
            let a = document.createElement("a");
            let url = URL.createObjectURL(file);
            a.href = url;
            a.download = `deepmind_patches_${"ABCDEFGH"[patchPack.bank]}_${patchPack.firstPatch + 1}-${patchPack.firstPatch + patchPack.patchCount}_${new Date(Date.now()).toISOString()}.sysex`
            document.body.appendChild(a);
            a.click();
            setTimeout(function () {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
        }
    });

    let sendButton = document.createElement("button");
    sendButton.id = "patchmanager_sendpatchesbutton";
    sendButton.textContent = "Send Patch Pack";
    sendButton.addEventListener("click", x => {
        let patchPack = makePatchPack();
        let warning = `Please note: sending this patch pack to your DeepMind will overwrite the ` +
                      `patches currently in bank ${"ABCDEFGH"[patchPack.bank]}, programs ${patchPack.firstPatch + 1} ` +
                      `to ${patchPack.firstPatch + patchPack.patchCount}.\n\nAre you happy to continue?`;
        if(confirm(warning)){
            let outport = getOutPort();
            outport.send(patchPack.buffer);
        }        
    });


    goContainer.appendChild(downloadButton);
    goContainer.appendChild(sendButton);

    return goContainer
}

function disableStuffThatNeedsMidi(){
    let disabledInputIds = [
        "patchmanager_portinselector",
        "patchmanager_portoutselector",
        "patchmanager_portTestStatusButton",
        "patchmanager_backupbutton",
        "patchmanager_sendpatchesbutton"
    ];

    let dimmedTextIds = [
        "patchmanager_portinselector",
        "patchmanager_portoutselector",
        "patchmanager_portTestStatusButton",
        "patchmanager_backupbutton",
        "patchmanager_sendpatchesbutton",
        "patchmanager_portinselectorlabel",
        "patchmanager_portoutselectorlabel",
        "patchmanager_backupparagraph"
    ];
    
    disabledInputIds.forEach(x => document.getElementById(x).setAttribute("disabled", null));
    dimmedTextIds.forEach(x => document.getElementById(x).classList.add("dimmed"));
}

function makeInterfaceImpl(container, patches){
    __patches__ = patches;
    container.appendChild(makePatchList(patches));
    container.appendChild(makeWriteLocationConatainer());
    container.appendChild(makeMidiPanel());
    container.appendChild(makeBackupPanel());
    container.appendChild(makeGoPanel());
    
    if(__midi__ == null){
        disableStuffThatNeedsMidi();
    }else if(__outputs__.length == 0){
        alert("No MIDI output devices found\n" +
        "You can still make use of this page to download your chosen patches, but you will need to send them to your synth yourself using a MIDI sysex librarian software.\n" +    
        "To make use of all features, please use a MIDI capable browser on a computer connected to your synth (by MIDI or USB) and allow the page access to your MIDI devices when prompted.\n" +
        "Please note that MIDI in the browser currently only works in Chrome and Opera.\n" +
        "If you declined MIDI access when prompted, please refresh the page and try again."
    );
        disableStuffThatNeedsMidi();
    }
}

function makeInterface(container, patches){
    // container should be a div
    // patches should be an object where the keys are the patch names and the
    //  values are the packed param data from a sysex dump as base64
   
    navigator.requestMIDIAccess({ sysex: true }).then(onMIDISuccess, onMIDIFailure).then(x => makeInterfaceImpl(container, patches))

}

function onMIDISuccess(result) {
    console.log("MIDI ready!");
    __midi__ = result;
    __outputs__ = new Array(...__midi__.outputs.values());
    __inputs__ = new Array(...__midi__.inputs.values());

}

function onMIDIFailure(msg) {
    alert("Could not get MIDI access.\n" +
    "You can still make use of this page to download your chosen patches, but you will need to send them to your synth yourself using a MIDI sysex librarian software.\n" +    
    "To make use of all features, please use a MIDI capable browser on a computer connected to your synth (by MIDI or USB) and allow the page access to your MIDI devices when prompted.\n" +
    "Please note that MIDI in the browser currently only works in Chrome and Opera.\n" +
    "If you declined MIDI access when prompted, please refresh the page and try again."
    );
    console.log("Failed to get MIDI access - " + msg);

}

