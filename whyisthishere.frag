#ifdef GL_ES
    precision highp float;
#endif

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

//iteraetion count
#define ITERATIONS 0.0

#define STEPS 0

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
		if (minDist < uHitThreshold) {
			stepsBeforeThreshold = i;
            break;
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
	for (int i = 0; i < STEPS; i++) {
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
    vec3 nDistX = marchNormalFindingRay(coords, direction + dirNormal1 * 0.0001);
    vec3 nDistY = marchNormalFindingRay(coords, direction + dirNormal2 * 0.0001);
    normal = -normalize(cross(dist - nDistX, dist - nDistY));
    return dist;
}

//light sources (currently unused)
vec3 lightSource = vec3(-1.0, -1.4, 0.0) * 2.5;
vec3 lightSource2 = vec3(1.0, 0.6, 0.5) * 2.5;

//lambertian diffuse shading
vec3 lambertShading(vec3 color, vec3 normal, vec3 light) {
	vec3 lightNormalized = normalize(light);
	float lightIntensity = max(0.0, dot(normal, lightNormalized));
	return color * lightIntensity;
}

//random function I found on stackoverflow
float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

//marches the rays, calculates normals, determines and returns color, etc.
void main() {
	vec3 coords = gl_FragCoord.xyz / (uViewportSize.y) - vec3(uViewportSize.x / uViewportSize.y * 0.5, 0.5, 0.0);
	coords.x *= 1.5 * fov;
	coords.y *= 1.5 * fov;
	

    vec3 cameraRay = rotateQuat(vec3(coords.x, 1.0, coords.y), uRotationQuaternion);


	float distToSurface = 0.0;
	int steps1 = STEPS;
    vec3 normal;
    vec3 color;
    vec3 dist = marchRayTrio(uPosition, cameraRay, distToSurface, steps1, normal, color);


	float distToSurface2 = 0.0;
	int steps2 = STEPS;
    vec3 normal2;
    vec3 color2;
    vec3 dist2 = marchRayTrio(uPosition, reflect(cameraRay, normal), distToSurface2, steps2, normal2, color2);

    vec3 outColor = (color + color2) / 2.0;

    vec3 adjustedLightLocation = lambertLightLocation;

	float shadowDistToSurface = 0.0;
	int shadowSteps = STEPS;
	vec3 shadowRay = marchShadowRay(dist + (adjustedLightLocation - dist) * uHitThreshold * 10.0, (adjustedLightLocation - dist), shadowDistToSurface, shadowSteps);

    float colorFactor;

	if (sign(shadowRay.x - lambertLightLocation.x) != sign(dist.x - lambertLightLocation.x)) {
        colorFactor = mix(uShadowBrightness, 1.0, lambertShading(vec3(1.0), normal, lambertLightLocation - dist).x);//;
	} else {
        colorFactor = uShadowBrightness;
	}
	gl_FragColor = vec4(outColor * (1.0 - float(steps1) / float(STEPS)) * colorFactor, 1.0);
    //gl_FragColor = vec4(normal, 1.0);
}