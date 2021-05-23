//Define canvas for WebGL.
var c = document.getElementById("canvas");

//TODO:
//Fix quaternion bug (rapid rotation messes it up) - complete
//Improve normal calculations - complete
//Fix framebuffer resize issue - complete
//Setup encapsulated raymarcher for proper linkages with GUI. - complete
//Implement new screenshot system

//=============================== USER INTERFACE =================================
let raymarcherSettings = {
    "Instructions": {
        description: "Use WASD, Space, and Shift to move. Press E to move the light source. Click the screen to control rotation w/ mouse. Use escape to exit rotation mode."
    },
    "UI and Viewer Controls": {
        settings: [
            {
                id: "hideUI",
                type: "checkbox",
                value: true,
                label: "Hide UI when controlling viewer",
                description: "If enabled, the UI rectangle will disappear completely while controlling the viewer's rotation and locking the mouse. Otherwise, it will be transparent.",
                indirect: true
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
                description: "Controls how fast you can move with WASD, Space, and Shift. Scales logarithmically.",
                indirect: true
            }
        ]
    },
    /*"Screenshot Controls": {
        settings: [   
            {
                id: "screenshotUseScreenSize",
                type: "checkbox",
                value: true,
                label: "Use size of current screen",
                description: "When taking a screenshot, use the current screen size rather than a specified screen size.",
                indirect: true
            },
            {
                id: "screenshotRaymarchingSteps",
                type: "range",
                min: 0,
                max: 1024,
                value: 512,
                label: "Screenshot Raymarching Steps",
                description: "When taking a screenshot, how many raymarching steps to use.",
                indirect: true
            },
            {
                id: "screenshotWidth",
                type: "number",
                value: 1920,
                label: "Screenshot Width (px)",
                description: "Width of screenshot in pixels.",
                indirect: true
            },
            {
                id: "screenshotHeight",
                type: "number",
                value: 1080,
                label: "Screenshot Height (px)",
                description: "Height of screenshot in pixels.",
                indirect: true
            }
        ]
    },*/
    "Fractal Controls": {
        settings: [
            {
                id: "fractalRotation1",
                type: "range",
                min: -Math.PI,
                max: Math.PI,
                value: 1,
                label: "Fractal Rotation 1",
                description: "Fractal rotation on the X-axis.",
                indirect: true
            },
            {
                id: "fractalRotation2",
                type: "range",
                min: -Math.PI,
                max: Math.PI,
                value: 1,
                label: "Fractal Rotation 2",
                description: "Fractal rotation on the Y-axis.",
                indirect: true
            },
            {
                id: "fractalRotation3",
                type: "range",
                min: -Math.PI,
                max: Math.PI,
                value: 1,
                label: "Fractal Rotation 3",
                description: "Fractal rotation on the Z-axis.",
                indirect: true
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
                id: "fractalIterations",
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
                id: "metallicMaterial",
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
                id: "uReflectionRoughness",
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
                id: "reflections",
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
                id: "uShadowSoftness",
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
                id: "raymarchingSteps",
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
                id: "additiveBlending",
                type: "checkbox",
                value: false,
                label: "Additive Blending",
                recompile: true,
                description: "Enables additive blending. Additive blending adds the current frame's colors to that of the previous frame (rather than replacing or mixing it). With this setting enabled, Previous Frame Trail is repurposed as the amount of the current frame to add. This option is useful for accumulating lots of samples for global illumination renders."
            },
            {
                id: "uBlendFactor",
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
                id: "uDOFStrength",
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
                id: "uFocalPlaneDistance",
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

function createRaymarcherSettingsMenu(settingsContainer, uiContainer, settings, inputHandler) {
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
                    console.log(e.type);
                    inputHandler(value, setting, e.type == "change");
                };


                if (setting.type == "checkbox") {
                    input.checked = setting.value;
                } else {
                    input.value = setting.value;
                }
                input.id = setting.id;

                inputListener({
                    currentTarget: input
                });


                input.addEventListener("input", inputListener);
                input.addEventListener("change", inputListener);

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


//===================================== SETTINGS ===================================

var playerTransform = {
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    velocity: [0, 0, 0],
    quatRotation: [0, -1, 0, 0]
};

window.addEventListener("resize", evt => {
    raymarcher.resolution = [c.width, c.height];
});

//Initialize the stuff
let rmSettings;
let raymarcher;
async function init() {
    
    raymarcher = new Raymarcher(c);
    raymarcher.resolution = [c.width, c.height];
    await raymarcher.init();
    let uiElem = document.getElementById("ui-container");
    let settingsElem = document.getElementById("settings");
    settingsElem.innerHTML = "";
    //while (uiElem.h) uiElem.removeChild(uiElem.lastChild);
    rmSettings = createRaymarcherSettingsMenu(
        settingsElem,
        uiElem,
        raymarcherSettings,
        (value, setting, isChange) => {
            if (!setting.indirect) {
                if (setting.recompile) {
                    if (isChange) {
                        raymarcher[setting.id] = value;
                    }
                } else {
                    raymarcher[setting.id] = value;
                }
            }
        }
    );

    drawLoop();
}

let lightLocation = [0, 0, 0];
//Draw loop
var t = 0;
async function drawLoop() {
    t++;
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
        lightLocation = playerTransform.position.concat();
        raymarcher.uLambertLightLocation = lightLocation;
        console.log(raymarcher.uLambertLightLocation);
    }
    if (keys.i) {
    }

    acceleration = acceleration.map(e => { return e * rmSettings.playerSpeed; });

    acceleration = vectorQuaternionMultiply(playerTransform.quatRotation, acceleration);
    playerTransform.velocity = playerTransform.velocity.map((e, i) => { return e + acceleration[i]; });
    playerTransform.position = playerTransform.position.map((e, i) => { return e + playerTransform.velocity[i]; });
    playerTransform.position = playerTransform.position.map(e => { return e * 0.9; });

    raymarcher.position = playerTransform.position;
    raymarcher.rotation = playerTransform.quatRotation;

    let fractalRotateQuat = [0, 1, 0, 0];

    fractalRotateQuat = quatMultiply(fractalRotateQuat, quatAngleAxis(rmSettings.fractalRotation1, [1, 0, 0]));
    fractalRotateQuat = quatMultiply(fractalRotateQuat, quatAngleAxis(rmSettings.fractalRotation2, [0, 1, 0]));
    fractalRotateQuat = quatMultiply(fractalRotateQuat, quatAngleAxis(rmSettings.fractalRotation3, [0, 0, 1]));

    raymarcher.uFractalRotation = fractalRotateQuat;

    raymarcher.renderSingleFrame();

    requestAnimationFrame(drawLoop);
}

init();