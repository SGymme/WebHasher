"use strict";

// Variables -----------------------------------------------------
const htmlFileInput = document.getElementById("formFileHTML");
const cssFileInput = document.getElementById("formFileCSS");
const jsFileInput = document.getElementById("formFileJS");

let htmlFileContent;
let cssFileContent = [];
let jsFileContent = [];
// ---------------------------------------------------------------

/**
 * Hashes all classes and id's of the given files
 */
async function hashFiles() {
    changeButton("DISABLE");
    await hashIDs();
    changeButton("ENABLE");

    // Create download button
    const submitButton = document.getElementById("submitButton");
    const buttonContainer = document.getElementById("buttonContainer");
    submitButton.style.width = "calc(100% - 60px)";
    buttonContainer.innerHTML += `<button id="downloadButton" class="btn btn-secondary" style="width: 44px" type="button" onclick="downloadZIP()"><svg viewBox="0 0 24 24" width="30" height="30" fill="#FFFFFF"><path d="M9.878,18.122a3,3,0,0,0,4.244,0l3.211-3.211A1,1,0,0,0,15.919,13.5l-2.926,2.927L13,1a1,1,0,0,0-1-1h0a1,1,0,0,0-1,1l-.009,15.408L8.081,13.5a1,1,0,0,0-1.414,1.415Z" /><path d="M23,16h0a1,1,0,0,0-1,1v4a1,1,0,0,1-1,1H3a1,1,0,0,1-1-1V17a1,1,0,0,0-1-1H1a1,1,0,0,0-1,1v4a3,3,0,0,0,3,3H21a3,3,0,0,0,3-3V17A1,1,0,0,0,23,16Z" /></svg></button>`
}

/**
 * Hashes all id's from the HTML file and replaces them in the css/js files
 */
async function hashIDs() {
    const submitButton = document.getElementById("submitButton");
    const buttonContainer = document.getElementById("buttonContainer");

    // Remove download button
    submitButton.style.width = "100%";
    submitButton.style.height = "44px";

    if (buttonContainer.children.length > 1) {
        buttonContainer.children[1].remove();
    }

    // Get all the content of the files
    await readFiles();

    // Get all hashed id's
    let hashedContent = await findIDs(htmlFileInput.files);

    // Replace all id's in HTML file
    await replaceIDs(hashedContent, "HTML");

    // Replace all id's in CSS files
    await replaceIDs(hashedContent, "CSS");

    // Replace all id's in JS files
    await replaceIDs(hashedContent, "JS");
}

/**
 * Downloads the zip file with the hashed files in it
 */
function downloadZIP() {
    let zip = new JSZip();

    // HTML file
    zip.file(htmlFileInput.files[0].name, htmlFileContent);

    // CSS files
    for (let i = 0; i < cssFileInput.files.length; i++) {
        zip.file(cssFileInput.files[i].name, cssFileContent[i]);
    }

    // JS files
    for (let i = 0; i < jsFileInput.files.length; i++) {
        zip.file(jsFileInput.files[i].name, jsFileContent[i]);
    }

    zip.generateAsync({ type: "blob" })
        .then(function (content) {
            saveAs(content, "HashedFiles.zip");
        });
}

/**
 * Gets all the content of the given files
 */
async function readFiles() {
    // Read HTML file
    htmlFileContent = await readFileContent(htmlFileInput.files[0])

    // Read CSS files
    for (let i = 0; i < cssFileInput.files.length; i++) {
        cssFileContent.push(await readFileContent(cssFileInput.files[i]));
    }

    // Read JS files
    for (let i = 0; i < jsFileInput.files.length; i++) {
        jsFileContent.push(await readFileContent(jsFileInput.files[i]));
    }
}

/**
 * Finds all id's file and returns an array with original id and hashed id
 * 
 * @returns 
 */
async function findIDs(files) {
    let hashedContent = [];

    for (let i = 0; i < files.length; i++) {
        const lines = htmlFileContent.split("\n");

        for (let s = 0; s < lines.length; s++) {
            if (lines[s].indexOf("id=") !== -1) {
                const startIndex = lines[s].indexOf("id=") + 4;
                const endIndex = startIndex + lines[s].substring(startIndex).indexOf('"');

                const currentID = lines[s].substring(startIndex, endIndex);
                const hashedID = await hashContent(currentID);

                hashedContent.push([currentID, hashedID]);
            }
        }
    }

    return hashedContent;
}

/**
 * Replaces all id's in content with hashed id and returns the new file content
 * 
 * @param {*} hashedContent 
 * @param {*} fileType
 * @returns
 */
async function replaceIDs(hashedContent, fileType) {
    let fileContent = "";
    const quoteReplace = [`"`, `'`, "`"];
    let files;

    if (fileType === "CSS") {
        files = cssFileInput.files;

        for (let i = 0; i < files.length; i++) {
            fileContent = cssFileContent[i];

            for (let s = 0; s < hashedContent.length; s++) {
                fileContent = fileContent.replaceAll(`#${hashedContent[s][0]}`, `#${hashedContent[s][1]}`);
            }

            cssFileContent[i] = fileContent;
        }
    } else if (fileType === "JS") {
        files = jsFileInput.files;

        for (let i = 0; i < files.length; i++) {
            fileContent = jsFileContent[i];

            for (let s = 0; s < hashedContent.length; s++) {
                for (let q = 0; q < quoteReplace.length; q++) {
                    const quote = quoteReplace[q];
                    const currentID = `${quote}${hashedContent[s][0]}${quote}`;
                    const replaceID = `${quote}${hashedContent[s][1]}${quote}`;

                    fileContent = fileContent.replaceAll(`getElementById(${currentID}`, `getElementById(${replaceID}`);
                }
            }

            jsFileContent[i] = fileContent;
        }
    } else {
        fileContent = htmlFileContent;
        files = htmlFileInput.files;

        for (let s = 0; s < hashedContent.length; s++) {
            fileContent = fileContent.replaceAll(`id="${hashedContent[s][0]}"`, `id="${hashedContent[s][1]}"`);
        }

        htmlFileContent = fileContent;
    }
    return fileContent;
}

/**
 * Enables or disables the submit button, depending on the given state
 * 
 * @param {*} state 
 */
function changeButton(state) {
    const submitButton = document.getElementById("submitButton");
    const buttonContainer = document.getElementById("buttonContainer");

    switch (state) {
        case "DISABLE":
            [htmlFileInput, cssFileInput, jsFileInput, submitButton].forEach((e) => e.disabled = true);
            submitButton.classList.replace("btn-primary", "btn-secondary");
            submitButton.innerHTML = `<span class="loader"></span>`;
            break;
        case "ENABLE":
            [htmlFileInput, cssFileInput, jsFileInput, submitButton].forEach((e) => e.disabled = false);
            submitButton.classList.replace("btn-secondary", "btn-primary");
            submitButton.innerHTML = `<svg width="20" height="20" fill="#FFFFFF" class="bi bi-play-fill" viewBox="0 0 16 16"><path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z" /></svg>&nbsp; Hash`;
            break;
    }
}

/**
 * Fetches the hashify API with SHA-256 and returns the first 6 characters of the (Base64 encoded) hashed content 
 * 
 * @param {*} content 
 * @returns 
 */
async function hashContent(content) {
    return await fetch("https://api.hashify.net/hash/sha256/hex?value=" + content)
        .then((response) => response.json())
        .then((data) => { return data.Digest.substring(0, 6) })
        .catch((error) => console.error(error));
}

/**
 * Gets the content of the given file
 * 
 * @param {*} file 
 * @returns 
 */
async function readFileContent(file) {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
        reader.onerror = () => {
            reader.abort();
            reject(new DOMException("Problem parsing input file."));
        };

        reader.onload = () => {
            resolve(reader.result);
        };
        reader.readAsText(file);
    });
}