
uniform highp vec2 uViewportSize;
uniform sampler2D tex;

void main() {
    gl_FragColor = texture2D(tex, gl_FragCoord.xy / uViewportSize);
    //gl_FragColor = vec4(gl_FragCoord.xy / uViewportSize, 0.0, 1.0);
}