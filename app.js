//Define canvas for WebGL.
var c = document.getElementById("canvas");
var gl = c.getContext("webgl2", { antialias: 0 });
gl.getExtension("EXT_color_buffer_float");

//TODO:
//Fix quaternion bug (rapid rotation messes it up) - complete
//Improve normal calculations - complete
//Fix framebuffer resize issue - complete

//=============================== USER INTERFACE =================================
let raymarcherSettings = {
    "Instructions": {
        description: "Use WASD, Space, and Shift to move. Press E to move the light source. Click the screen to control rotation w/ mouse. Use escape to exit rotation mode. Press I to take a screenshot."
    },
    "UI and Viewer Controls": {
        settings: [
            {
                id: "hideUI",
                type: "checkbox",
                value: true,
                label: "Hide UI when controlling viewer",
                description: "If enabled, the UI rectangle will disappear completely while controlling the viewer's rotation and locking the mouse. Otherwise, it will be transparent."
            },
            {
                id: "playerSpeed",
                type: "range",
                min: -4,
                max: 1,
                value: -1,
                label: "Player Speed",
                transformer: num => {
                    return Math.pow(10, num);
                },
                description: "Controls how fast you can move with WASD, Space, and Shift. Scales logarithmically."
            }
        ]
    },
    "Screenshot Controls": {
        settings: [   
            {
                id: "screenshotUseScreenSize",
                type: "checkbox",
                value: true,
                label: "Use size of current screen",
                description: "When taking a screenshot, use the current screen size rather than a specified screen size."
            },
            {
                id: "screenshotRaymarchingSteps",
                type: "range",
                min: 0,
                max: 1024,
                value: 512,
                label: "Screenshot Raymarching Steps",
                description: "When taking a screenshot, how many raymarching steps to use."
            },
            {
                id: "screenshotWidth",
                type: "number",
                value: 1920,
                label: "Screenshot Width (px)",
                description: "Width of screenshot in pixels."
            },
            {
                id: "screenshotHeight",
                type: "number",
                value: 1080,
                label: "Screenshot Height (px)",
                description: "Height of screenshot in pixels."
            }
        ]
    },
    "Fractal Controls": {
        settings: [
            {
                id: "fractalRotation1",
                type: "range",
                min: -Math.PI,
                max: Math.PI,
                value: 1,
                label: "Fractal Rotation 1",
                description: "Fractal rotation on the X-axis."
            },
            {
                id: "fractalRotation2",
                type: "range",
                min: -Math.PI,
                max: Math.PI,
                value: 1,
                label: "Fractal Rotation 2",
                description: "Fractal rotation on the Y-axis."
            },
            {
                id: "fractalRotation3",
                type: "range",
                min: -Math.PI,
                max: Math.PI,
                value: 1,
                label: "Fractal Rotation 3",
                description: "Fractal rotation on the Z-axis."
            },
            {
                id: "uFractalScaleFactor",
                type: "range",
                min: 0,
                max: 1,
                value: 0.5,
                label: "Fractal Scale Factor",
                description: "Proportion to scale the cubes by during each fractal iteration."
            },
            {
                id: "uFractalIterations",
                type: "range",
                min: 1,
                max: 22,
                value: 7,
                step: 1,
                label: "Fractal Iterations",
                recompile: true,
                description: "Number of fractal iterations to perform (more = more detail, but slower)."
            },
        ]
    },
    "Material Controls": {
        settings: [
            {
                id: "metallic",
                type: "checkbox",
                value: false,
                label: "Metallic Material",
                recompile: true,
                description: "Enables mirror-like reflections."
            },
            {
                id: "uFractalColor",
                type: "color",
                value: "#444444",
                label: "Fractal Color",
                transformer: hex2rgb,
                description: "Sets the color of the fractal. Currently unimplemented."
            },
            {
                id: "uRoughness",
                type: "range",
                min: 0,
                max: 0.99,
                value: 0,
                label: "Reflection Roughness",
                description: "Set low for a mirror-like finish. Set high for a blurrier appearance."
            }
        ]
    },
    "Lighting Controls": {
        settings: [
            {
                id: "uShadowBrightness",
                type: "range",
                min: 0,
                max: 1,
                value: 0.5,
                label: "Shadow Brightness",
                description: "Sets the brightness of shaded areas. Set this to zero if attempting global illumination."
            },
            {
                id: "uAOStrength",
                type: "range",
                min: 0,
                max: 1,
                value: 1.0,
                label: "Ambient Occlusion Strength",
                description: "Determines the strength of the effect of Ambient Occlusion (AO). Ambient Occlusion darkens tight corners to simulate the difficulty of light reaching such a place. It is a rough approximation of how light tends to have difficulty reaching tight corners. Set this to zero if attempting global illumination."
            },
            {
                id: "uReflections",
                type: "range",
                min: 1,
                max: 8,
                value: 1,
                step: 1,
                label: "Reflections",
                recompile: true,
                description: "Number of reflections to calculate (requires lots of computation!)."
            },
            {
                id: "uSoftShadows",
                type: "range",
                min: -6,
                max: 1,
                value: -6,
                label: "Shadow Softness",
                transformer: num => {
                    return Math.pow(10, num) - Math.pow(10, -6);
                },
                description: "Blends the edges of shadows. Scales logarithmically."
            },
            {
                id: "uLightStrength",
                type: "range",
                min: -4,
                max: 4,
                value: 0,
                label: "Light Intensity",
                transformer: num => {
                    return Math.pow(10, num);
                },
                description: "Determines the intensity of the light source. Scales logarithmically."
            }
        ]
    },
    "Raymarching Controls": {
        settings: [
            {
                id: "uRaymarchingSteps",
                type: "range",
                min: 0,
                max: 1024,
                value: 24,
                step: 1,
                label: "Raymarching Steps",
                recompile: true,
                description: "Raymarching works by projecting rays from the viewer like a camera flash. These rays are marched forward in several steps, asymptotically approaching the surface they're rendering. This setting controls the maximum number of these steps. A higher value will lead to more detail, especially around tight corners and edges. However, it will also lead to a significant slowdown."
            },
            {
                id: "normalRaymarchingSteps",
                type: "range",
                min: 0,
                max: 64,
                value: 8,
                step: 1,
                label: "Normal-finding Raymarching Steps",
                recompile: true,
                description: "Sets the number of raymarching steps for rays used to calculate normals. Low values are faster, but can lead to lighting artifacts, especially with geometry facing only barely towards the viewer (just under 90 degrees). See the section on Raymarching Steps for more information. "
            },
            {
                id: "uRayHitThreshold",
                type: "range",
                min: -6,
                max: 0,
                value: -4,
                label: "Ray Hit Threshold",
                transformer: num => {
                    return Math.pow(10, num);
                },
                description: "Since rays asymptotically approach the surface of the fractal, they will never truly reach its surface, making it necessary to add a distance threshold, under which the rays will be considered to have hit the surface. This threshold is the Ray Hit Threshold. This setting scales logarithmically. See the Raymarching Steps setting for more information."
            },
            {
                id: "transmissionRaymarchingSteps",
                type: "range",
                min: 0,
                max: 256,
                value: 32,
                step: 1,
                label: "Transmission Raymarching Steps",
                recompile: true,
                description: "Determines the number of raymarching steps for transmission rays. See the description for Transmission Ray Steps for more information."
            },
            {
                id: "transmissionRayCount",
                type: "range",
                min: 0,
                max: 8,
                value: 0,
                step: 1,
                label: "Transmission Ray Count",
                recompile: true,
                description: "Determines the number of transmission rays. Transmission rays are rays that replicate the effect of light shining through fog, creating so-called 'god rays'."
            },
        ]
    },
    "Camera Controls": {
        settings: [
            {
                id: "additive",
                type: "checkbox",
                value: false,
                label: "Additive Blending",
                recompile: true,
                description: "Enables additive blending. Additive blending adds the current frame's colors to that of the previous frame (rather than replacing or mixing it). With this setting enabled, Previous Frame Trail is repurposed as the amount of the current frame to add. This option is useful for accumulating lots of samples for global illumination renders."
            },
            {
                id: "uTrail",
                type: "number",
                // min: 0,
                // max: 1,
                value: 0.0,
                label: "Previous Frame Trail",
                description: "Proportion of current frame to blend with previous. If Additive Blending is enabled, this instead determines how much of the current frame to add to the accumulated samples."
            },
            {
                id: "uFOV",
                type: "range",
                min: 0,
                max: 4,
                value: 1.5,
                label: "FOV",
                description: "Sets the field of view."
            },
            {
                id: "uDofStrength",
                type: "range",
                min: -4,
                max: 0,
                value: -4,
                label: "Depth of Field Strength",
                transformer: num => {
                    return Math.pow(10, num) - Math.pow(10, -4);
                },
                description: "Controls strength of the Depth of Field (DoF) effect. Scales logarithmically."
            },
            {
                id: "uDofDistance",
                type: "range",
                min: -6,
                max: 2,
                value: -0.8,
                label: "Focal Plane Distance",
                transformer: num => {
                    return Math.pow(10, num);
                },
                description: "Controls the distance of the camera's focal plane. Scales logarithmically."
            }
        ]
    }
}

function createRaymarcherSettingsMenu(settingsContainer, uiContainer, settings, recompileShaderHandler) {
    let currentValues = {};
    let bigHeader = document.createElement("h1");
    settingsContainer.appendChild(bigHeader);
    bigHeader.innerText = "Settings";

    let hoverExplanationContainer = document.createElement("div");
    hoverExplanationContainer.className = "hover-explanation-container";
    uiContainer.appendChild(hoverExplanationContainer);

    let hoverExplanationHeader = document.createElement("h2");
    hoverExplanationContainer.appendChild(hoverExplanationHeader);

    let hoverExplanationDescription = document.createElement("p");
    hoverExplanationContainer.appendChild(hoverExplanationDescription);
    hoverExplanationDescription.innerText = "Hover over a setting to view information about it.";
    Object.keys(settings).forEach(headerName => {
        let header = document.createElement("h2");
        header.innerText = headerName;
        settingsContainer.appendChild(header);

        if (settings[headerName].description) {
            let desc = document.createElement("p");
            desc.innerText = settings[headerName].description;
            settingsContainer.appendChild(desc);
        }

        if (settings[headerName].settings) {
            settings[headerName].settings.forEach(setting => {
                let label = document.createElement("label");
                label.innerText = setting.label;
                label.className = "setting-label";

                let input = document.createElement("input");
                input.type = setting.type;

                if (setting.type == "range") {
                    input.min = setting.min;
                    input.max = setting.max;
                    input.className = "range-input";
                    input.step = setting.step || 0.001;
                } else if (setting.type == "number") {
                    input.className = "range-input";
                }

                let inputListener = e => {
                    let elem = e.currentTarget;
                    let value = (elem.type == "checkbox") ? elem.checked : elem.value;
                    if (elem.type == "number" || elem.type == "range") {
                        value = Number(value);
                    }
                    if (setting.transformer) value = setting.transformer(value);
                    currentValues[elem.id] = value;
                };


                if (setting.type == "checkbox") {
                    input.checked = setting.value;
                } else {
                    input.value = setting.value;
                    //if (setting.transformer) console.log(setting.transformer(setting.value));
                    //if (setting.transformer) input.value = setting.value;
                }
                input.id = setting.id;

                inputListener({
                    currentTarget: input
                });


                input.addEventListener("input", inputListener);

                if (setting.recompile) {
                    input.addEventListener("change", e => {
                        recompileShaderHandler();
                    });
                }

                label.addEventListener("mouseover", e => {
                    hoverExplanationHeader.innerText = setting.label;
                    hoverExplanationDescription.innerText = setting.description || "No description provided.";
                    hoverExplanationContainer.style.top = `${label.getBoundingClientRect().y - hoverExplanationContainer.getBoundingClientRect().height / 2}px`;
                });

                settingsContainer.appendChild(label);
                label.appendChild(input);
                settingsContainer.appendChild(document.createElement("br"));
            });
        }
    });

    return currentValues;
}

c.requestPointerLock = c.requestPointerLock ||
                            c.mozRequestPointerLock;
document.exitPointerLock = document.exitPointerLock ||
                            document.mozExitPointerLock;

c.onclick = function () {
    c.requestPointerLock();
}

var pointerLockEnabled = false;

document.addEventListener('pointerlockchange', pointerLockHandler, false);
document.addEventListener('mozpointerlockchange', pointerLockHandler, false);

function pointerLockHandler(e) {
    pointerLockEnabled = document.pointerLockElement === c ||
    document.mozPointerLockElement === c;
    if (pointerLockEnabled && rmSettings.hideUI) {
        document.getElementById("ui-container").style.opacity = 0;
    } else {
        document.getElementById("ui-container").style.opacity = null;
    }
}

document.addEventListener('mousemove', function (e) {
    if (pointerLockEnabled) {
        playerTransform.rotation[0] += e.movementX * 0.003;
        playerTransform.rotation[1] += e.movementY * 0.003;

        let xRotation = quatAngleAxis(e.movementX * -0.003, vectorQuaternionMultiply(playerTransform.quatRotation, [0, 0, 1]));
        let yRotation = quatAngleAxis(e.movementY * -0.003, vectorQuaternionMultiply(playerTransform.quatRotation, [1, 0, 0]));

        playerTransform.quatRotation = quatMultiply(xRotation, playerTransform.quatRotation);
        playerTransform.quatRotation = quatMultiply(yRotation, playerTransform.quatRotation);
        playerTransform.quatRotation = normalize(playerTransform.quatRotation);
    }
});


var keys = {};
document.addEventListener("keydown", function (e) {
    keys[e.key.toLowerCase()] = true;
});
document.addEventListener("keyup", function (e) {
    keys[e.key.toLowerCase()] = false;
});



//=============================== GENERAL UTILS =================================
//Compiles a shader.
function compileShader(shaderCode, type) {
	var shader = gl.createShader(type);
    
    gl.shaderSource(shader, shaderCode);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log(`Error compiling ${type === gl.VERTEX_SHADER ? "vertex" : "fragment"} shader:`);
        console.log(gl.getShaderInfoLog(shader));
    }
    return shader;
}

//Builds the shader program.
function buildShaderProgram(vert, frag) {
    
    var shaderProgram = gl.createProgram();
    
    gl.attachShader(shaderProgram, compileShader(vert, gl.VERTEX_SHADER));
    
    gl.attachShader(shaderProgram, compileShader(frag, gl.FRAGMENT_SHADER));
    
    gl.linkProgram(shaderProgram);

    return shaderProgram;
}

//xmlhttprequest promise (haha this is just a crappy fetch api lmao)
async function request(text) {
    var req = new XMLHttpRequest();
    var returnPromise = new Promise((resolve, reject) => {
        req.onreadystatechange = function () {
            if (req.readyState === 4) {
                if (req.status === 200) {
                    resolve(req);
                }
            }
        }
    });
    req.open("GET", text);
    req.send();
    return returnPromise;
}


function hex2rgb(hex) {
    return [
        parseInt(hex.substring(1, 3), 16),
        parseInt(hex.substring(3, 5), 16),
        parseInt(hex.substring(5, 7), 16)
    ];
}

function createTexture(gl) {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return texture;
}

function createAndAddToTexture(gl, image) {
    let texture = createTexture(gl);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    return texture;
}



//=============================== LINEAR ALGEBRA =================================
function matMultiply(vec, mat) {
    return [
        vec[0] * mat[0] + vec[1] * mat[3] + vec[2] * mat[6],
        vec[0] * mat[1] + vec[1] * mat[4] + vec[2] * mat[7],
        vec[0] * mat[2] + vec[1] * mat[5] + vec[2] * mat[8]
    ];
}

function matMultiplyMat(mat1, mat2) {
    return [
        dotProduct([mat1[0], mat1[1], mat1[2]], [mat2[0], mat2[3], mat2[6]]), dotProduct([mat1[0], mat1[1], mat1[2]], [mat2[1], mat2[4], mat2[7]]), dotProduct([mat1[0], mat1[1], mat1[2]], [mat2[2], mat2[5], mat2[8]]),
        dotProduct([mat1[3], mat1[4], mat1[5]], [mat2[0], mat2[3], mat2[6]]), dotProduct([mat1[3], mat1[4], mat1[5]], [mat2[1], mat2[4], mat2[7]]), dotProduct([mat1[3], mat1[4], mat1[5]], [mat2[2], mat2[5], mat2[8]]),
        dotProduct([mat1[6], mat1[7], mat1[8]], [mat2[0], mat2[3], mat2[6]]), dotProduct([mat1[6], mat1[7], mat1[8]], [mat2[1], mat2[4], mat2[7]]), dotProduct([mat1[6], mat1[7], mat1[8]], [mat2[2], mat2[5], mat2[8]]),
    ]
}

function rotateX(angle) {
    return [
        1, 0, 0,
        0, Math.cos(angle), -Math.sin(angle),
        0, Math.sin(angle), Math.cos(angle)
    ];
}

function rotateY(angle) {
    return [
        Math.cos(angle), 0, Math.sin(angle),
        0, 1, 0,
        -Math.sin(angle), 0, Math.cos(angle)
    ];
}

function rotateZ(angle) {
    return [
        Math.cos(angle), -Math.sin(angle), 0,
        Math.sin(angle), Math.cos(angle), 0,
        0, 0, 1
    ];
}

function getValue(elemID) {
    return Number(document.getElementById(elemID).value);
}

function vectorAdd(v1, v2) {
    return v1.map((e, i) => { return e + v2[i]; });
}

function dotProduct(v1, v2) {
    var sum = 0;
    for (var i = 0; v1.length > i; i++) {
        sum += v1[i] * v2[i];
    }
    return sum;
}

function crossProduct(v1, v2) {
    return [
        v1[1] * v2[2] - v1[2] * v2[1],
        v1[2] * v2[0] - v1[0] * v2[2],
        v1[0] * v2[1] - v1[1] * v2[0]
    ]
}

function norm(v) {
    return v.reduce((acc, cur) => { return acc + cur * cur }, 0);
}

function normalize(v) {
    return scalarDivide(v, Math.hypot(...v));
}

function scalarMultiply(v, s) {
    return v.map(e => { return e * s });
}

function scalarDivide(v, s) {
    return v.map(e => { return e / s });
}

function quatConjugate(q) {
    return [q[0], -q[1], -q[2], -q[3]];
}

function quatInverse(q) {
    return scalarDivide(quatConjugate(q), norm(q));
}

function quatMultiply(q1, q2) {
    var w1 = q1[0];
    var w2 = q2[0];
    var v1 = [q1[1], q1[2], q1[3]];
    var v2 = [q2[1], q2[2], q2[3]];
    return [w1 * w2 - dotProduct(v1, v2), ...vectorAdd(vectorAdd(crossProduct(v1, v2), scalarMultiply(v2, w1)), scalarMultiply(v1, w2))]
}

function quatAngleAxis(angle, axis) {
    return [Math.cos(angle / 2), ...scalarMultiply(axis, Math.sin(angle / 2))];
}

function vectorQuaternionMultiply(q, v) {
    //var result = quatMultiply(quatMultiply(q, [0, ...v]), quatInverse(q));
    
    //result.splice(0, 1);
    //return result;
    let qi = [q[1], q[2], q[3]];
    return vectorAdd(v, crossProduct(qi, vectorAdd(crossProduct(qi, v), v.map(comp => comp * q[0]))).map(comp => comp * 2));
}

function quatToMatrix(q) {
    var w = q[0];
    var x = q[1];
    var y = q[2];
    var z = q[3];

    var w2 = w * w;
    var x2 = x * x;
    var y2 = y * y;
    var z2 = z * z;
    
    var wx = w * x;
    var wy = w * y;
    var wz = w * z;
    
    var xy = x * y;
    var xz = x * z;

    var yz = y * z;

    return [
        1 - 2 * y2 - 2 * z2, 2 * xy - 2 * wz, 2 * xz + 2 * wy,
        2 * xy + 2 * wz, 1 - 2 * x2 - 2 * z2, 2 * yz - 2 * wx,
        2 * xz - 2 * wy, 2 * yz + 2 * wx, 1 - 2 * x2 - 2 * y2
    ];
}

function matrixTranspose(m) {
    return [
        m[0], m[3], m[6],
        m[1], m[4], m[7],
        m[2], m[5], m[8]
    ];
}

function quatToEuler(q) {
    return [
        Math.atan2(2*q[2] * q[0] - 2 * q[1] * q[3], 1 - 2 * q[2] * q[2] - 2 * q[3] * q[3]),
        Math.asin(2 * q[1] * q[2] + 2 * q[3] * q[0]),
        Math.atan2(2*q[1] * q[0] - 2 * q[2] * q[3], 1 - 2 * q[1] * q[1] - 2 * q[3] * q[3])
    ]
}

//===================================== SETTINGS ===================================

var playerTransform = {
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    velocity: [0, 0, 0],
    quatRotation: [0, -1, 0, 0]
};

var uiParams = {
    fractalRotationParams: [0.1, 0.1, 0.1],
    playerSpeedMultiplier: 100,
    scaleFactor: 0.5,
    fov: 1,
    lambertLightLocation: [0, 0, 0],
    fractalColor: [1.0, 1.0, 1.0],
    fractalIterations: 7,
    raymarchingSteps: 24,
    shadowBrightness: 0.4,
    rayHitThreshold: 0.0001,
    shaderChoice: "fragment.frag"
}

function replaceMacro(source, macroName, value) {
    return source.replace(`#define ${macroName}`, `#define ${macroName} ${value} //`);
}

async function recompileShader() {
    var vertShader = (await request("shaders/vertex.vert")).response;
    var fragShader = (await request("shaders/" + uiParams.shaderChoice)).response;
    fragShader = replaceMacro(fragShader, "ITERATIONS", rmSettings.uFractalIterations + ".0");
    fragShader = replaceMacro(fragShader, "STEPS", rmSettings.uRaymarchingSteps);
    fragShader = replaceMacro(fragShader, "NORMALSTEPS", rmSettings.normalRaymarchingSteps);
    fragShader = replaceMacro(fragShader, "REFLECTIONS", rmSettings.uReflections);
    fragShader = replaceMacro(fragShader, "TRANSMISSIONSTEPS", rmSettings.transmissionRaymarchingSteps);
    fragShader = replaceMacro(fragShader, "TRANSMISSIONRAYS", rmSettings.transmissionRayCount);
    if (rmSettings.additive) fragShader = "#define ADDITIVE\n" + fragShader;
    if (!rmSettings.metallic) fragShader = "#define DIFFUSE\n" + fragShader;
    if (rmSettings.additive) {
        if (resetState == 0) {
            fragShader = "#define RESET\n" + fragShader;
            resetState = 2;
        }
    } else {
        resetState = 0;
    }
    prog = buildShaderProgram(vertShader, fragShader);
}

// document.getElementById("fractal-iterations").onchange = function () {
//     uiParams.fractalIterations = getValue("fractal-iterations");
//     recompileShader();
// }
// document.getElementById("raymarching-steps").onchange = function () {
//     uiParams.raymarchingSteps = getValue("raymarching-steps");
//     recompileShader();
// }
// document.getElementById("shader-choice").onchange = function () {
//     uiParams.shaderChoice = document.getElementById("shader-choice").value;
//     recompileShader();
// }


var prog;
var vertexBuffer

let rmSettings;

let prevFrame;
let prevFramebuffer;

let currentFrame;
let currentFramebuffer;

let blitProgram;

let resetState = 0;

function resizeWindow() {
    c.width = window.innerWidth;
    c.height = window.innerHeight;

    
    //======= PREVIOUS FRAME =========
    prevFrame = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, prevFrame);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA32F, c.width, c.height, 0, gl.RGBA, gl.FLOAT, null
    );

    prevFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, prevFramebuffer);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, prevFrame, 0
    );
    
    
    //======= CURRENT FRAME =========
    currentFrame = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, currentFrame);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA32F, c.width, c.height, 0, gl.RGBA, gl.FLOAT, null
    );

    currentFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, currentFramebuffer);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, currentFrame, 0
    );
}

resizeWindow();

window.addEventListener("resize", resizeWindow);

//Initialize the stuff
async function init() {

    var blitVShader = (await request("shaders/vertex.vert")).response;
    var blitFShader = (await request("shaders/blit.frag")).response;
    blitProgram = buildShaderProgram(blitVShader, blitFShader);
    // var vertShader = (await request("vertex.glsl")).response;
    // var fragShader = (await request("fragment.glsl")).response;
    // prog = buildShaderProgram(vertShader, fragShader);
    
    let uiElem = document.getElementById("ui-container");
    let settingsElem = document.getElementById("settings");
    settingsElem.innerHTML = "";
    //while (uiElem.h) uiElem.removeChild(uiElem.lastChild);
    rmSettings = createRaymarcherSettingsMenu(
        settingsElem,
        uiElem,
        raymarcherSettings,
        recompileShader
    );


    await recompileShader();
    
    var vertexArray = new Float32Array([
    	-1, 1, 1, 1, 1, -1,
     	-1, 1, 1, -1, -1, -1
    ]);
    
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);


    drawLoop();
}


//Draw loop
var t = 0;
async function drawLoop() {
    t++;

    gl.viewport(0, 0, c.width, c.height);


    // uiParams.fractalRotationParams = [
    //     getValue("fractal-rotation-0"),
    //     getValue("fractal-rotation-1"),
    //     getValue("fractal-rotation-2")
    // ];
    // uiParams.playerSpeedMultiplier = Math.pow(10, getValue("player-speed"));
    // uiParams.scaleFactor = getValue("scale-factor");
    // uiParams.fov = getValue("fov");
    // uiParams.fractalColor = hex2rgb(document.getElementById("fractal-color").value).map(e => { return e / 64; });
    // uiParams.shadowBrightness = getValue("shadow-brightness");
    // uiParams.rayHitThreshold = Math.pow(10, getValue("ray-hit-threshold"));

    var acceleration = [0, 0, 0]

    if (keys.w) {
        acceleration[1] += 0.01;
    }
    if (keys.a) {
        acceleration[0] += -0.01;
    }
    if (keys.s) {
        acceleration[1] += -0.01;
    }
    if (keys.d) {
        acceleration[0] += 0.01;
    }
    if (keys.shift) {
        acceleration[2] += -0.01;
    }
    if (keys[" "]) {
        acceleration[2] += 0.01;
    }
    if (keys.ArrowUp) {
        playerTransform.quatRotation = quatMultiply(quatAngleAxis(0.01, vectorQuaternionMultiply(playerTransform.quatRotation, [1, 0, 0])), playerTransform.quatRotation)
    }
    if (keys.ArrowDown) {
        playerTransform.quatRotation = quatMultiply(quatAngleAxis(-0.01, vectorQuaternionMultiply(playerTransform.quatRotation, [1, 0, 0])), playerTransform.quatRotation)
    }
    if (keys.ArrowLeft) {
        playerTransform.quatRotation = quatMultiply(quatAngleAxis(0.01, vectorQuaternionMultiply(playerTransform.quatRotation, [0, 0, 1])), playerTransform.quatRotation)
    }
    if (keys.ArrowRight) {
        playerTransform.quatRotation = quatMultiply(quatAngleAxis(-0.01, vectorQuaternionMultiply(playerTransform.quatRotation, [0, 0, 1])), playerTransform.quatRotation)
    }
    if (keys.e) {
        uiParams.lambertLightLocation = playerTransform.position.concat();
    }
    if (keys.i) {
        // if (!document.getElementById("use-current-screen-size").checked) {
        //     c.width = getValue("screenshot-width");
        //     c.height = getValue("screenshot-height");
        // }
        // var prevRSteps = uiParams.raymarchingSteps;
        // uiParams.raymarchingSteps = getValue("screenshot-raymarching-steps");
        // await recompileShader();
        // uiParams.raymarchingSteps = prevRSteps;
    }

    acceleration = acceleration.map(e => { return e * rmSettings.playerSpeed; });

    acceleration = vectorQuaternionMultiply(playerTransform.quatRotation, acceleration);//matMultiply(matMultiply(matMultiply(acceleration, rotateX(playerTransform.rotation[1])), rotateZ(playerTransform.rotation[0])), rotateY(playerTransform.rotation[2]));

    playerTransform.velocity = playerTransform.velocity.map((e, i) => { return e + acceleration[i]; });
    playerTransform.position = playerTransform.position.map((e, i) => { return e + playerTransform.velocity[i]; });
    playerTransform.position = playerTransform.position.map(e => { return e * 0.9; });


    //gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, currentFramebuffer);


    // gl.clearColor(1.0, 1.0, 1.0, 1.0);
    // gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.useProgram(prog);


    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, prevFrame);
    gl.uniform1i(gl.getUniformLocation(prog, "prevFrame"), 0);
    
    //gl.uniform4fv(gl.getUniformLocation(prog, "uGlobalColor"), [t * 0.01, 0.0, 0.0, 0.0]);
    gl.uniform1f(gl.getUniformLocation(prog, "time"), t);
    gl.uniform1f(gl.getUniformLocation(prog, "scaleFactor"), rmSettings.uFractalScaleFactor);
    gl.uniform3fv(gl.getUniformLocation(prog, "uPosition"), playerTransform.position);
    gl.uniform3fv(gl.getUniformLocation(prog, "lambertLightLocation"), uiParams.lambertLightLocation);
    gl.uniform4fv(gl.getUniformLocation(prog, "uRotationQuaternion"), playerTransform.quatRotation);
    gl.uniform2fv(gl.getUniformLocation(prog, "uViewportSize"), [c.width, c.height]);
    gl.uniform1f(gl.getUniformLocation(prog, "fov"), rmSettings.uFOV);
    gl.uniform3fv(gl.getUniformLocation(prog, "uFractalColor"), rmSettings.uFractalColor);
    gl.uniform1f(gl.getUniformLocation(prog, "uShadowBrightness"), rmSettings.uShadowBrightness);
    gl.uniform1f(gl.getUniformLocation(prog, "uHitThreshold"), rmSettings.uRayHitThreshold);
    gl.uniform1f(gl.getUniformLocation(prog, "uRoughness"), rmSettings.uRoughness);
    gl.uniform1f(gl.getUniformLocation(prog, "uAOStrength"), rmSettings.uAOStrength);
    gl.uniform1f(gl.getUniformLocation(prog, "uTrail"), rmSettings.uTrail);

    gl.uniform1f(gl.getUniformLocation(prog, "uDofStrength"), rmSettings.uDofStrength);
    gl.uniform1f(gl.getUniformLocation(prog, "uDofDistance"), rmSettings.uDofDistance);

    gl.uniform1f(gl.getUniformLocation(prog, "uSoftShadows"), rmSettings.uSoftShadows);
    gl.uniform1f(gl.getUniformLocation(prog, "uLightStrength"), rmSettings.uLightStrength);

    //gl.

    let fractalRotateQuat = [0, 1, 0, 0];

    fractalRotateQuat = quatMultiply(fractalRotateQuat, quatAngleAxis(rmSettings.fractalRotation1, [1, 0, 0]));
    fractalRotateQuat = quatMultiply(fractalRotateQuat, quatAngleAxis(rmSettings.fractalRotation2, [0, 1, 0]));
    fractalRotateQuat = quatMultiply(fractalRotateQuat, quatAngleAxis(rmSettings.fractalRotation3, [0, 0, 1]));
    //console.log(fractalRotateQuat);

    gl.uniform4fv(gl.getUniformLocation(prog, "uIterationRotationQuaternion"), fractalRotateQuat);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    
    var aVertexPosition =
      gl.getAttribLocation(prog, "aVertexPosition");

    gl.enableVertexAttribArray(aVertexPosition);
    gl.vertexAttribPointer(aVertexPosition, 2,
        gl.FLOAT, false, 0, 0);
    
    gl.drawArrays(gl.TRIANGLES, 0, 6);



    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, currentFramebuffer);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.blitFramebuffer(0, 0, c.width, c.height, 0, 0, c.width, c.height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
        

    //gl.bindFramebuffer(gl.READ_FRAMEBUFFER, currentFramebuffer);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, prevFramebuffer);
    gl.blitFramebuffer(0, 0, c.width, c.height, 0, 0, c.width, c.height, gl.COLOR_BUFFER_BIT, gl.NEAREST);


    if (keys.i) {
        keys.i = false;
        c.toBlob(blob => {
            saveAs(blob, "fractal_screenshot.png")
        });
        resizeWindow();
        recompileShader();
    }

    if (resetState == 2) {
        recompileShader();
    }
    requestAnimationFrame(drawLoop);
}

init();