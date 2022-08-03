// Variables -----------------------------------------------------
const htmlFileInput = document.getElementById("formFileHTML");
const cssFileInput = document.getElementById("formFileCSS");
const jsFileInput = document.getElementById("formFileJS");
const submitButton = document.getElementById("submitButton");

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
}

/**
 * Hashes all id's from the HTML file and replaces them in the css/js files
 */
async function hashIDs() {
    // Get all the content of the files
    await readFiles();

    // Get all hashed id's
    let hashedContent = await findIDs(htmlFileInput.files);

    // Replace all id's in HTML file
    const htmlContent = await replaceIDs(hashedContent, "HTML");
    console.log(htmlContent + "\n\n\n");

    // Replace all id's in CSS files
    const cssContent = await replaceIDs(hashedContent, "CSS");
    console.log(cssContent + "\n\n\n");

    // Replace all id's in JS files
    const jsContent = await replaceIDs(hashedContent, "JS");
    console.log(jsContent + "\n\n\n")
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
        }
    } else {
        fileContent = htmlFileContent;
        files = htmlFileInput.files;

        for (let s = 0; s < hashedContent.length; s++) {
            fileContent = fileContent.replaceAll(`id="${hashedContent[s][0]}"`, `id="${hashedContent[s][1]}"`);
        }
    }
    return fileContent;
}

/**
 * Enables or disables the submit button, depending on the given state
 * 
 * @param {*} state 
 */
function changeButton(state) {
    switch (state) {
        case "DISABLE":
            [htmlFileInput, cssFileInput, jsFileInput, submitButton].forEach((e) => e.disabled = true);
            submitButton.classList.replace("btn-primary", "btn-secondary");
            submitButton.innerHTML = `<span class="loader"></span>`;
            break;
        case "ENABLE":
            [htmlFileInput, cssFileInput, jsFileInput, submitButton].forEach((e) => e.disabled = false);
            submitButton.classList.replace("btn-secondary", "btn-primary");
            submitButton.innerHTML = "Hash";
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