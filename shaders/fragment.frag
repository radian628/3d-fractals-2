#ifdef GL_ES
    precision highp float;
#endif

//#define DIFFUSE
//#define ADDITIVE

uniform vec3 uPosition;
uniform float time;
uniform float scaleFactor;
uniform vec3 lambertLightLocation;
uniform vec4 uRotationQuaternion;
uniform vec2 uViewportSize;
uniform float fov;
uniform vec3 uFractalColor;
uniform float uShadowBrightness;
uniform float uHitThreshold;
uniform vec4 uIterationRotationQuaternion;
uniform float uRoughness;
uniform float uAOStrength;
uniform sampler2D prevFrame;
uniform float uTrail;

varying highp vec2 vTexCoord; 

//iteraetion count
#define ITERATIONS 0.0

#define STEPS 0
#define NORMALSTEPS 0

#define REFLECTIONS 1

//rotate using quaternion
vec3 rotateQuat(vec3 position, vec4 q)
{ 
  vec3 v = position.xyz;
  return v + 2.0 * cross(q.yzw, cross(q.yzw, v) + q.x * v);
}

//reflect across all three axes
vec3 reflectAxes(vec3 a) {
	return vec3(abs(a.z), abs(a.x), abs(a.y));
}

//ray reflection iteration
vec3 rayReflectIteration(vec3 a, vec3 offset, float iteration) {
	return rotateQuat(reflectAxes(a) + offset, uIterationRotationQuaternion);
}


//cube signed distance function (SDF)
float cubeSDF(vec3 rayPosition, vec3 cubePosition, float cubeSize) {
	vec3 dist = abs(rayPosition) - cubePosition;
	return length(max(max(max(dist.x, dist.y), dist.z), 0.0)) + min(max(dist.x, max(dist.y, dist.z)), 0.0);
}

//fractal SDF
float fractalSDF(vec3 rayPosition, vec3 spherePosition, float sphereRadius, out vec3 color) {
	vec3 rayPos2 = rayPosition;
    float minDist = 99999.9;
    float minDist2 = 99999.9;
	for (float i = 0.0; i < ITERATIONS; i++) {
		rayPos2 = rayReflectIteration(rayPos2 / scaleFactor, vec3(-2.0), i);
        minDist = min(minDist, distance(rayPos2, vec3(0.5, 0.5, 0.5)));
        minDist2 = min(minDist2, distance(rayPos2, vec3(-0.9, 0.25, 1.5)));
	}
    color = vec3(1.0, minDist * 0.5, minDist2 * 0.5);
	return cubeSDF(rayPos2, spherePosition, sphereRadius) * pow(scaleFactor, ITERATIONS);
}

//scene SDF
float globalSDF(vec3 rayPosition, out vec3 color) {
	return fractalSDF(/*mod(rayPosition + vec3(1.0f), 2f) - vec3(1.0f)*/rayPosition, vec3(2.0, 2.0, 2.0), 2.0, color);
}
//scene SDF
float globalSDF(vec3 rayPosition) {
    vec3 color;
	return fractalSDF(/*mod(rayPosition + vec3(1.0f), 2f) - vec3(1.0f)*/rayPosition, vec3(2.0, 2.0, 2.0), 2.0, color);
}

//march a single ray
vec3 marchCameraRay(vec3 origin, vec3 direction, out float finalMinDist, out int stepsBeforeThreshold, out vec3 color) {
	vec3 directionNormalized = normalize(direction);
	vec3 position = origin;
	float minDist = 0.0;
	for (int i = 0; i < STEPS; i++) {
		minDist = globalSDF(position, color);
		position += directionNormalized * minDist;
		if (minDist > uHitThreshold) {
			stepsBeforeThreshold = i;
            //break;
		}
	}
	finalMinDist = minDist;
	return position;
}

//march a ray used for finding normals
vec3 marchNormalFindingRay(vec3 origin, vec3 direction) {
    vec3 directionNormalized = normalize(direction);
	vec3 position = origin;
	float minDist = 0.0;
	for (int i = 0; i < NORMALSTEPS; i++) {
		minDist = globalSDF(position);
		position += directionNormalized * minDist;
		// if (minDist < uHitThreshold) {
        //     break;
		// }
	}
	return position;
}

//march a ray intended for shadows
vec3 marchShadowRay(vec3 origin, vec3 direction, out float finalMinDist, out int stepsBeforeThreshold) {
	vec3 directionNormalized = normalize(direction);
	vec3 position = origin;
	float minDist = 0.0;
	for (int i = 0; i < STEPS; i++) {
		minDist = globalSDF(position);
		position += directionNormalized * minDist;
		if (minDist < uHitThreshold || sign(position.x - lambertLightLocation.x) != sign(origin.x - lambertLightLocation.x)) {
			stepsBeforeThreshold = i;
            break;
		}
	}
	finalMinDist = minDist;
	return position;
}

vec3 marchRayTrio(vec3 coords, vec3 direction, out float finalMinDist, out int stepsBeforeThreshold, out vec3 normal, out vec3 color) {
	vec3 dist = marchCameraRay(coords, direction, finalMinDist, stepsBeforeThreshold, color);
    vec3 dirNormal1 = normalize(cross(direction, vec3(1.0, 1.0, 1.0)));
    vec3 dirNormal2 = normalize(cross(direction, dirNormal1));
    vec3 nDistX = marchNormalFindingRay(dist + dirNormal1 * 0.00024, direction);
    vec3 nDistY = marchNormalFindingRay(dist + dirNormal2 * 0.00024, direction);
    normal = -normalize(cross(dist - nDistX, dist - nDistY));
    return dist;
}

//light sources (currently unused)
vec3 lightSource = vec3(-1.0, -1.4, 0.0) * 2.5;
vec3 lightSource2 = vec3(1.0, 0.6, 0.5) * 2.5;

//lambertian diffuse shading
vec3 lambertShading(vec3 color, vec3 normal, vec3 light) {
	vec3 lightNormalized = normalize(light);
	float lightIntensity = max(0.0, dot(normal, lightNormalized)) / dot(light, light);
	return color * lightIntensity;
}

//random function I found on stackoverflow
float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

vec3 getColor(vec3 position, vec3 normal, int steps, vec3 shadowPosition, vec3 baseColor) {
    float colorFactor;
    
	if (sign(shadowPosition.x - lambertLightLocation.x) != sign(position.x - lambertLightLocation.x)) {
        colorFactor = mix(uShadowBrightness, 1.0, lambertShading(vec3(1.0), normal, lambertLightLocation - position).x);//;
	} else {
        colorFactor = uShadowBrightness;
	}

    return baseColor * (1.0 - float(steps) / float(STEPS) * uAOStrength) * colorFactor;
}

vec3 rgbAsymptote(vec3 rgb) {
    return 1.0 - 0.5 / (rgb + 0.5);
}

//marches the rays, calculates normals, determines and returns color, etc.
void main() {
	vec3 coords = gl_FragCoord.xyz / (uViewportSize.y) - vec3(uViewportSize.x / uViewportSize.y * 0.5, 0.5, 0.0);
	vec2 texCoords = coords.xy;
    coords.x *= 1.5 * fov;
	coords.y *= 1.5 * fov;
	

    vec3 outColor = vec3(0.0);

    vec2 cameraNoiseVecs = vec2(
        rand(vec2(time * 77.0, -123.3 * time) * coords.xy),
        rand(vec2(time * -177.0, 346.0 * time) * coords.xy)
    ) * coords.xy / uViewportSize;

    vec3 rayStartPos = uPosition;
    vec3 cameraRay = rotateQuat(vec3(coords.x + cameraNoiseVecs.x, 1.0, coords.y + cameraNoiseVecs.y), uRotationQuaternion);

    for (int i = 0; i < REFLECTIONS; i++) {

        float distToSurface = 0.0;
        int steps1 = STEPS;
        vec3 normal;
        vec3 color;
        vec3 rayHit = marchRayTrio(rayStartPos, cameraRay, distToSurface, steps1, normal, color);
        
        float shadowDistToSurface = 0.0;
        int shadowSteps = STEPS;
        vec3 shadowRayHit1 = marchShadowRay(rayHit + (lambertLightLocation - rayHit) * uHitThreshold * 10.0, (lambertLightLocation - rayHit), shadowDistToSurface, shadowSteps);

        outColor += getColor(rayHit, normal, steps1, shadowRayHit1, color);

        vec3 reflectVec = reflect(cameraRay, normal);
        
        float floati = float(i + 1);

        vec3 noise = vec3(
            rand(coords.xy + vec2(time, time) + floati),
            rand(coords.xy + vec2(time + 234.0, -time) + floati),
            rand(coords.xy + vec2(-time - 76.0, 55.0 + time) + floati)
        ) * uRoughness;

        rayStartPos = rayHit + reflectVec * uHitThreshold * 15.0;
        #ifdef DIFFUSE
        cameraRay = normal + noise;
        #else
        cameraRay = reflectVec + noise;
        #endif
    }

    outColor /= float(REFLECTIONS);
    outColor *= 2.0;
    outColor = rgbAsymptote(outColor);

    /*
    vec3 reflectVec = reflect(cameraRay, normal);

	float distToSurface2 = 0.0;
	int steps2 = STEPS;
    vec3 normal2;
    vec3 color2;
    vec3 rayHit2 = marchRayTrio(rayHit + reflectVec * uHitThreshold * 15.0, reflectVec, distToSurface2, steps2, normal2, color2);

	float shadowDistToSurface2 = 0.0;
	int shadowSteps2 = STEPS;
	vec3 shadowRayHit2 = marchShadowRay(rayHit2 + (lambertLightLocation - rayHit2) * uHitThreshold * 10.0, (lambertLightLocation - rayHit2), shadowDistToSurface, shadowSteps2);
    */
    //vec3 outColor = (color + color2 * lambertShading(vec3(1.0), normal2, lambertLightLocation - dist2)) / 2.0;

    // vec3 outColor = (
    //     getColor(rayHit, normal, steps1, shadowRayHit1, color) +
    //     getColor(rayHit2, normal2, steps2, shadowRayHit2, color2)
    // ) / 2.0;

    // float colorFactor;

	// if (sign(shadowRay.x - lambertLightLocation.x) != sign(dist.x - lambertLightLocation.x)) {
    //     colorFactor = mix(uShadowBrightness, 1.0, lambertShading(vec3(1.0), normal, lambertLightLocation - dist).x);//;
	// } else {
    //     colorFactor = uShadowBrightness;
	// }
	//gl_FragColor = vec4(outColor, 1.0);
    #ifdef ADDITIVE
    gl_FragColor = vec4(outColor, 1.0) * uTrail + vec4(texture2D(prevFrame, vTexCoord).rgb, 1.0);//vec4(outColor * (1.0 - float(steps1) / float(STEPS)) * colorFactor, 1.0);
    #else
    gl_FragColor = mix(vec4(outColor, 1.0), vec4(texture2D(prevFrame, vTexCoord).rgb, 1.0), uTrail);
    #endif

    #ifdef RESET
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    #endif
}