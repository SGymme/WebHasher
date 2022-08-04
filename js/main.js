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
    await readFiles();
    await hashIDs();
    await hashClasses();
    changeButton("ENABLE");
}

/**
 * Hashes all id's from the HTML file and replaces them in the css/js files
 */
async function hashIDs() {
    // Get all hashed id's
    let hashedContent = await findIDs();

    // Check if hashed id's are valid
    for (let i = 0; i < hashedContent.length; i++) {
        hashedContent[i][1] = checkHashedContent(hashedContent[i][1]);
    }

    // Replace all id's in HTML file
    await replaceIDs(hashedContent, "HTML");

    // Replace all id's in CSS files
    await replaceIDs(hashedContent, "CSS");

    // Replace all id's in JS files
    await replaceIDs(hashedContent, "JS");
}

/**
 * Hashes all classes from the HTML file and replaces them in the css/js files
 */
async function hashClasses() {
    let hashedContent = await findClasses();

    // Check if hashed classes are valid
    for (let i = 0; i < hashedContent.length; i++) {
        hashedContent[i][1] = checkHashedContent(hashedContent[i][1]);
    }

    // Replace all classes in HTML file
    await replaceClasses(hashedContent, "HTML");

    // Replace all classes in CSS files
    await replaceClasses(hashedContent, "CSS");

    // Replace all classes in JS files
    await replaceClasses(hashedContent, "JS");
}

/**
 * Downloads the zip file with the hashed files in it
 */
function downloadZIP() {
    let zip = new JSZip();

    // HTML file
    zip.file(htmlFileInput.files[0].name, htmlFileContent);

    // CSS files
    if (cssFileInput.files.length > 0) {
        let cssFolder = zip.folder("css");
        for (let i = 0; i < cssFileInput.files.length; i++) {
            cssFolder.file(cssFileInput.files[i].name, cssFileContent[i]);
        }
    }

    // JS files
    if (jsFileInput.files.length > 0) {
        let jsFolder = zip.folder("js");
        for (let i = 0; i < jsFileInput.files.length; i++) {
            jsFolder.file(jsFileInput.files[i].name, jsFileContent[i]);
        }
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
 * Finds all id's and returns an array with original id and hashed id
 * 
 * @returns 
 */
async function findIDs() {
    let hashedContent = [];
    const lines = htmlFileContent.split("\n");

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].indexOf("id=") !== -1) {
            const startIndex = lines[i].indexOf("id=") + 4;
            const endIndex = startIndex + lines[i].substring(startIndex).indexOf('"');

            const currentID = lines[i].substring(startIndex, endIndex);
            const hashedID = await hashContent(currentID);

            hashedContent.push([currentID, hashedID]);
        }
    }

    return hashedContent;
}

/**
 * Finds all classes and returns an array with original and hashed classes
 * 
 * @returns
 */
async function findClasses() {
    let hashedContent = [];
    const lines = htmlFileContent.split("\n");

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].indexOf("class=") !== -1) {
            const startIndex = lines[i].indexOf("class=") + 7;
            const endIndex = startIndex + lines[i].substring(startIndex).indexOf('"');

            const allClasses = lines[i].substring(startIndex, endIndex).split(" ");
            for (let s = 0; s < allClasses.length; s++) {
                if (allClasses[s] !== " " && allClasses[s] !== "") {
                    const currentID = allClasses[s];
                    const hashedID = await hashContent(currentID);

                    hashedContent.push([currentID, hashedID]);
                }
            }
        }
    }
    return Array.from(new Set(hashedContent.map(JSON.stringify)), JSON.parse);
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
                // Case 1 "#... "
                fileContent = fileContent.replaceAll(`#${hashedContent[s][0]} `, `#${hashedContent[s][1]} `);
                // Case 2 "#...,"
                fileContent = fileContent.replaceAll(`#${hashedContent[s][0]},`, `#${hashedContent[s][1]},`);
                // Case 3 "#...:"
                fileContent = fileContent.replaceAll(`#${hashedContent[s][0]}:`, `#${hashedContent[s][1]}:`);
                // Case 4 "#...."
                fileContent = fileContent.replaceAll(`#${hashedContent[s][0]}.`, `#${hashedContent[s][1]}.`);
                // Case 5 "(#...)"
                fileContent = fileContent.replaceAll(`(#${hashedContent[s][0]})`, `(#${hashedContent[s][1]})`);
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

        for (let s = 0; s < hashedContent.length; s++) {
            fileContent = fileContent.replaceAll(`id="${hashedContent[s][0]}"`, `id="${hashedContent[s][1]}"`);
        }

        htmlFileContent = fileContent;
    }
    return fileContent;
}

/**
 * Replaces all classes in content with hashed class and returns the new file content
 * 
 * @param {*} hashedContent 
 * @param {*} fileType 
 * @returns
 */
async function replaceClasses(hashedContent, fileType) {
    let fileContent = "";
    const quoteReplace = [`"`, `'`, "`"];
    let files;

    if (fileType === "CSS") {
        files = cssFileInput.files;

        for (let i = 0; i < files.length; i++) {
            fileContent = cssFileContent[i];

            for (let s = 0; s < hashedContent.length; s++) {
                const currentID = hashedContent[s][0];
                const replaceID = hashedContent[s][1];

                // Case 1 - ".--- "
                fileContent = fileContent.replaceAll(`.${currentID} `, `.${replaceID} `);
                // Case 2 - ".---,"
                fileContent = fileContent.replaceAll(`.${currentID},`, `.${replaceID},`);
                // Case 3 - ".---."
                fileContent = fileContent.replaceAll(`.${currentID}.`, `.${replaceID}.`);
                // Case 4 ".---:"
                fileContent = fileContent.replaceAll(`.${currentID}:`, `.${replaceID}:`);
                // Case 5 "(.---)"
                fileContent = fileContent.replaceAll(`(.${currentID})`, `(.${replaceID})`);
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

                    fileContent = fileContent.replaceAll(`${currentID}`, `${replaceID}`);
                }
            }

            jsFileContent[i] = fileContent;
        }
    } else {
        fileContent = htmlFileContent;

        for (let s = 0; s < hashedContent.length; s++) {
            const currentID = hashedContent[s][0];
            const replaceID = hashedContent[s][1];

            // Case 1 - "..."
            fileContent = fileContent.replaceAll(`"${currentID}"`, `"${replaceID}"`);
            // Case 2 - "... "
            fileContent = fileContent.replaceAll(`"${currentID} `, `"${replaceID} `);
            // Case 3 - " ..."
            fileContent = fileContent.replaceAll(` ${currentID}"`, ` ${replaceID}"`);
            // Case 4 " ... "
            fileContent = fileContent.replaceAll(` ${currentID} `, ` ${replaceID} `);
        }

        htmlFileContent = fileContent;
    }
    return fileContent
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

            // Remove download button
            submitButton.style.width = "100%";
            submitButton.style.height = "44px";

            if (buttonContainer.children.length > 1) {
                buttonContainer.children[1].remove();
            }
            break;
        case "ENABLE":
            [htmlFileInput, cssFileInput, jsFileInput, submitButton].forEach((e) => e.disabled = false);
            submitButton.classList.replace("btn-secondary", "btn-primary");
            submitButton.innerHTML = `<svg width="20" height="20" fill="#FFFFFF" class="bi bi-play-fill" viewBox="0 0 16 16"><path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z" /></svg>&nbsp; Hash`;

            // Create download button
            submitButton.style.width = "calc(100% - 60px)";
            buttonContainer.innerHTML += `<button id="downloadButton" class="btn btn-secondary" style="width: 44px" type="button" onclick="downloadZIP()"><svg viewBox="0 0 24 24" width="30" height="30" fill="#FFFFFF"><path d="M9.878,18.122a3,3,0,0,0,4.244,0l3.211-3.211A1,1,0,0,0,15.919,13.5l-2.926,2.927L13,1a1,1,0,0,0-1-1h0a1,1,0,0,0-1,1l-.009,15.408L8.081,13.5a1,1,0,0,0-1.414,1.415Z" /><path d="M23,16h0a1,1,0,0,0-1,1v4a1,1,0,0,1-1,1H3a1,1,0,0,1-1-1V17a1,1,0,0,0-1-1H1a1,1,0,0,0-1,1v4a3,3,0,0,0,3,3H21a3,3,0,0,0,3-3V17A1,1,0,0,0,23,16Z" /></svg></button>`
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
    return await fetch("https://api.hashify.net/hash/sha256/base64url?value=" + content)
        .then((response) => response.json())
        .then((data) => {
            return data.Digest.substring(0, 6);
        })
        .catch((error) => console.error(error));
}

/**
 * Checks if hashed string is valid and changes it if not
 * 
 * @param {*} hashedString 
 * @returns 
 */
function checkHashedContent(hashedString) {
    const alphanumeric = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
    let startsWithAlpha = false;

    for (let i = 0; i < alphanumeric.length; i++) {
        if (hashedString.toLowerCase().startsWith(alphanumeric[i])) {
            startsWithAlpha = true;
            break;
        }
    }

    if (!startsWithAlpha) {
        hashedString = hashedString.substring(1, 6);

        let randomNumb = Math.floor(Math.random() * alphanumeric.length);
        let randomNumb2 = Math.floor(Math.random() * 2) + 1;
        hashedString = randomNumb2 == 1 ? alphanumeric[randomNumb] + hashedString : alphanumeric[randomNumb].toUpperCase() + hashedString;
    }

    let randomNumb = Math.floor(Math.random() * alphanumeric.length);
    hashedString = hashedString.replaceAll("-", alphanumeric[randomNumb]);

    return hashedString;
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