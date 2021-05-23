
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

//====================== GENERAL UTIL ==========================

function replaceMacro(source, macroName, value) {
    return source.replace(`#define ${macroName}`, `#define ${macroName} ${value} //`);
}

function compileShader(gl, shaderCode, type) {
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
function buildShaderProgram(gl, vert, frag) {
    
    var shaderProgram = gl.createProgram();
    
    gl.attachShader(shaderProgram, compileShader(gl, vert, gl.VERTEX_SHADER));
    
    gl.attachShader(shaderProgram, compileShader(gl, frag, gl.FRAGMENT_SHADER));
    
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
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return texture;
}

function createAndAddToTexture(gl, image) {
    let texture = createTexture(gl);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    return texture;
}

function vequals(a, b) {
    if (Array.isArray(a) && Array.isArray(b)) {
        let equal = true;
        a.forEach((e, i) => {
            if (e != b[i]) equal = false;
        });
        return equal;
    } else {
        return a == b;
    }
}




class Raymarcher {
    constructor(canvas) {
        this.c = canvas;
        this.gl = this.c.getContext("webgl2", { antialias: 0 });
        this.gl.getExtension("EXT_color_buffer_float");
        this.position = [0.01, 0.01, 0.01];
        this.rotation = [0.9689124217106447, 0.12370197962726147, 0.12370197962726147, 0.12370197962726147];
        this._resolution = [1920, 1080];

        this.uFractalRotation = [0.9689124217106447, 0.12370197962726147, 0.12370197962726147, 0.12370197962726147];
        this.uFractalScaleFactor = 0.495;
        this.fractalIterations = 7;

        this.metallicMaterial = false;
        this.uFractalColor = [0.25, 0.25, 0.25];
        this.uReflectionRoughness = 0;

        this.uShadowBrightness = 0.5;
        this.uAOStrength = 1.0;
        this._reflections = 1;
        this.uShadowSoftness = 0;
        this.uLightStrength = 1;
        this.uLambertLightLocation = [0.001, 0.001, 0.001];

        this._raymarchingSteps = 24;
        this._normalRaymarchingSteps = 8;
        this.uRayHitThreshold = 0.0001;
        this._transmissionRaymarchingSteps = 32;
        this._transmissionRayCount = 0;

        this._additiveBlending = false;
        this.uBlendFactor = 0;
        this.uFOV = 1.5;
        this.uDOFStrength = 0;
        this.uFocalPlaneDistance = 0.2;
        
        this.recompileNextFrame = false;
        this.recreateFramebuffers = false;

        this.resetState = 0;
        this.t = 0;
    }

    set resolution (res) {
        this.recreateFramebuffers = true;
        this._resolution = res;
    }

    set fractalIterations(v) {
        this.recompileNextFrame = true;
        this._fractalIterations = v;
    }
    set metallicMaterial(v) {
        this.recompileNextFrame = true;
        this._metallicMaterial = v;
    }
    set reflections(v) {
        this.recompileNextFrame = true;
        this._reflections = v;
    }
    set raymarchingSteps(v) {
        this.recompileNextFrame = true;
        this._raymarchingSteps = v;
    }
    set normalRaymarchingSteps(v) {
        this.recompileNextFrame = true;
        this._normalRaymarchingSteps = v;
    }
    set transmissionRaymarchingSteps(v) {
        this.recompileNextFrame = true;
        this._transmissionRaymarchingSteps = v;
    }
    set transmissionRayCount(v) {
        this.recompileNextFrame = true;
        this._transmissionRayCount = v;
    }
    set additiveBlending(v) {
        this.recompileNextFrame = true;
        this._additiveBlending = v;
    }

    createFramebuffers() {
        let gl = this.gl;
        this.c.width = this._resolution[0];
        this.c.height = this._resolution[1];
        gl.viewport(0, 0, ...this._resolution);

        //======= PREVIOUS FRAME =========
        this.prevFrame = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.prevFrame);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGBA32F, this.c.width, this.c.height, 0, gl.RGBA, gl.FLOAT, null
        );

        this.prevFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.prevFramebuffer);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.prevFrame, 0
        );
        
        
        //======= CURRENT FRAME =========
        this.currentFrame = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.currentFrame);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGBA32F, this.c.width, this.c.height, 0, gl.RGBA, gl.FLOAT, null
        );

        this.currentFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.currentFramebuffer);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.currentFrame, 0
        );
    }

    async init() {
        let gl = this.gl;

        this.createFramebuffers();

        await this.recompileShader();

        let vertexArray = new Float32Array([
            -1, 1, 1, 1, 1, -1,
            -1, 1, 1, -1, -1, -1
        ]);
        
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);
    }

    async recompileShader() {

        var vertShader = (await request("shaders/vertex.vert")).response;
        var fragShader = (await request("shaders/fragment.frag")).response;
        fragShader = replaceMacro(fragShader, "ITERATIONS", this._fractalIterations + ".0");
        fragShader = replaceMacro(fragShader, "STEPS", this._raymarchingSteps);
        fragShader = replaceMacro(fragShader, "NORMALSTEPS", this._normalRaymarchingSteps);
        fragShader = replaceMacro(fragShader, "REFLECTIONS", this._reflections);
        fragShader = replaceMacro(fragShader, "TRANSMISSIONSTEPS", this._transmissionRaymarchingSteps);
        fragShader = replaceMacro(fragShader, "TRANSMISSIONRAYS", this._transmissionRayCount);
        if (this._additiveBlending) fragShader = "#define ADDITIVE\n" + fragShader;
        if (!this._metallicMaterial) fragShader = "#define DIFFUSE\n" + fragShader;
        if (this._additiveBlending) {
            if (this.resetState == 0) {
                fragShader = "#define RESET\n" + fragShader;
                this.resetState = 1;
            }
        } else {
            this.resetState = 0;
        }
        //console.log(fragShader);
        this.prog = buildShaderProgram(this.gl, vertShader, fragShader);
    }

    async renderSingleFrame() {
        let gl = this.gl;
            
        this.t++;

        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.currentFramebuffer);

        gl.useProgram(this.prog);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.prevFrame);
        gl.uniform1i(gl.getUniformLocation(this.prog, "uPrevFrame"), 0);
        //console.log(this.uLambertLightLocation, this.uLightStrength);
        gl.uniform1f(gl.getUniformLocation(this.prog, "uTime"), this.t);
        gl.uniform1f(gl.getUniformLocation(this.prog, "uScaleFactor"), this.uFractalScaleFactor);
        gl.uniform3fv(gl.getUniformLocation(this.prog, "uPosition"), this.position);
        gl.uniform3fv(gl.getUniformLocation(this.prog, "uLambertLightLocation"), this.uLambertLightLocation);
        gl.uniform4fv(gl.getUniformLocation(this.prog, "uRotationQuaternion"), this.rotation);
        gl.uniform2fv(gl.getUniformLocation(this.prog, "uViewportSize"), this._resolution);
        gl.uniform1f(gl.getUniformLocation(this.prog, "uFOV"), this.uFOV);
        gl.uniform3fv(gl.getUniformLocation(this.prog, "uFractalColor"), this.uFractalColor);
        gl.uniform1f(gl.getUniformLocation(this.prog, "uShadowBrightness"), this.uShadowBrightness);
        gl.uniform1f(gl.getUniformLocation(this.prog, "uHitThreshold"), this.uRayHitThreshold);
        gl.uniform1f(gl.getUniformLocation(this.prog, "uRoughness"), this.uReflectionRoughness);
        gl.uniform1f(gl.getUniformLocation(this.prog, "uAOStrength"), this.uAOStrength);
        gl.uniform1f(gl.getUniformLocation(this.prog, "uTrail"), this.uBlendFactor);

        gl.uniform1f(gl.getUniformLocation(this.prog, "uDofStrength"), this.uDOFStrength);
        gl.uniform1f(gl.getUniformLocation(this.prog, "uDofDistance"), this.uFocalPlaneDistance);

        gl.uniform1f(gl.getUniformLocation(this.prog, "uSoftShadows"), this.uShadowSoftness);
        gl.uniform1f(gl.getUniformLocation(this.prog, "uLightStrength"), this.uLightStrength);

        gl.uniform4fv(gl.getUniformLocation(this.prog, "uIterationRotationQuaternion"), this.uFractalRotation);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        
        let aVertexPosition = gl.getAttribLocation(this.prog, "aVertexPosition");

        gl.enableVertexAttribArray(aVertexPosition);
        gl.vertexAttribPointer(aVertexPosition, 2,
            gl.FLOAT, false, 0, 0);
        
        gl.drawArrays(gl.TRIANGLES, 0, 6);



        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.currentFramebuffer);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
        gl.blitFramebuffer(0, 0, this.c.width, this.c.height, 0, 0, this.c.width, this.c.height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
            

        //gl.bindFramebuffer(gl.READ_FRAMEBUFFER, currentFramebuffer);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.prevFramebuffer);
        gl.blitFramebuffer(0, 0, this.c.width, this.c.height, 0, 0, this.c.width, this.c.height, gl.COLOR_BUFFER_BIT, gl.NEAREST);

        if (this.resetState == 2) {
            await this.recompileShader();
        } else if (this.recompileNextFrame) {
            await this.recompileShader();
            this.recompileNextFrame = false;
        } 
        
        if (this.recreateFramebuffers) {
            this.createFramebuffers();
            this.recreateFramebuffers = false;
        }
    }
}