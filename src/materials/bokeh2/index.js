import THREE from "three";

const fragment = "#include <packing>\n\nuniform sampler2D tDiffuse;\nuniform sampler2D tDepth;\n\nuniform vec2 texelSize;\nuniform vec2 halfTexelSize;\n\nuniform float cameraNear;\nuniform float cameraFar;\n\nuniform float focalLength;\nuniform float fStop;\n\nuniform float maxBlur;\nuniform float luminanceThreshold;\nuniform float luminanceGain;\nuniform float bias;\nuniform float fringe;\nuniform float ditherStrength;\n\n#ifdef SHADER_FOCUS\n\n\tuniform vec2 focusCoords;\n\n#else\n\n\tuniform float focalDepth;\n\n#endif\n\nvarying vec2 vUv;\n\n#ifdef PENTAGON\n\n\tfloat penta(vec2 coords) {\n\n\t\tconst vec4 HS0 = vec4( 1.0,          0.0,         0.0, 1.0);\n\t\tconst vec4 HS1 = vec4( 0.309016994,  0.951056516, 0.0, 1.0);\n\t\tconst vec4 HS2 = vec4(-0.809016994,  0.587785252, 0.0, 1.0);\n\t\tconst vec4 HS3 = vec4(-0.809016994, -0.587785252, 0.0, 1.0);\n\t\tconst vec4 HS4 = vec4( 0.309016994, -0.951056516, 0.0, 1.0);\n\t\tconst vec4 HS5 = vec4( 0.0,          0.0,         1.0, 1.0);\n\n\t\tconst vec4 ONE = vec4(1.0);\n\n\t\tconst float P_FEATHER = 0.4;\n\t\tconst float N_FEATHER = -P_FEATHER;\n\n\t\tfloat inOrOut = -4.0;\n\n\t\tvec4 P = vec4(coords, vec2(RINGS_FLOAT - 1.3));\n\n\t\tvec4 dist = vec4(\n\t\t\tdot(P, HS0),\n\t\t\tdot(P, HS1),\n\t\t\tdot(P, HS2),\n\t\t\tdot(P, HS3)\n\t\t);\n\n\t\tdist = smoothstep(N_FEATHER, P_FEATHER, dist);\n\n\t\tinOrOut += dot(dist, ONE);\n\n\t\tdist.x = dot(P, HS4);\n\t\tdist.y = HS5.w - abs(P.z);\n\n\t\tdist = smoothstep(N_FEATHER, P_FEATHER, dist);\n\t\tinOrOut += dist.x;\n\n\t\treturn clamp(inOrOut, 0.0, 1.0);\n\n\t}\n\n#endif\n\n#ifdef SHOW_FOCUS\n\n\tvec3 debugFocus(vec3 c, float blur, float depth) {\n\n\t\tfloat edge = 0.002 * depth;\n\t\tfloat m = clamp(smoothstep(0.0, edge, blur), 0.0, 1.0);\n\t\tfloat e = clamp(smoothstep(1.0 - edge, 1.0, blur), 0.0, 1.0);\n\n\t\tc = mix(c, vec3(1.0, 0.5, 0.0), (1.0 - m) * 0.6);\n\t\tc = mix(c, vec3(0.0, 0.5, 1.0), ((1.0 - e) - (1.0 - m)) * 0.2);\n\n\t\treturn c;\n\n\t}\n\n#endif\n\n#ifdef VIGNETTE\n\n\tfloat vignette() {\n\n\t\tconst vec2 CENTER = vec2(0.5);\n\n\t\tconst float VIGNETTE_OUT = 1.3;\n\t\tconst float VIGNETTE_IN = 0.0;\n\t\tconst float VIGNETTE_FADE = 22.0; \n\n\t\tfloat d = distance(vUv, CENTER);\n\t\td = smoothstep(VIGNETTE_OUT + (fStop / VIGNETTE_FADE), VIGNETTE_IN + (fStop / VIGNETTE_FADE), d);\n\n\t\treturn clamp(d, 0.0, 1.0);\n\n\t}\n\n#endif\n\nvec2 rand(vec2 coord) {\n\n\tvec2 noise;\n\n\t#ifdef NOISE\n\n\t\tconst float a = 12.9898;\n\t\tconst float b = 78.233;\n\t\tconst float c = 43758.5453;\n\n\t\tnoise.x = clamp(fract(sin(mod(dot(coord, vec2(a, b)), 3.14)) * c), 0.0, 1.0) * 2.0 - 1.0;\n\t\tnoise.y = clamp(fract(sin(mod(dot(coord, vec2(a, b) * 2.0), 3.14)) * c), 0.0, 1.0) * 2.0 - 1.0;\n\n\t#else\n\n\t\tnoise.x = ((fract(1.0 - coord.s * halfTexelSize.x) * 0.25) + (fract(coord.t * halfTexelSize.y) * 0.75)) * 2.0 - 1.0;\n\t\tnoise.y = ((fract(1.0 - coord.s * halfTexelSize.x) * 0.75) + (fract(coord.t * halfTexelSize.y) * 0.25)) * 2.0 - 1.0;\n\n\t#endif\n\n\treturn noise;\n\n}\n\nvec3 processTexel(vec2 coords, float blur) {\n\n\tconst vec3 LUM_COEFF = vec3(0.299, 0.587, 0.114);\n\n\tvec3 c;\n\tc.r = texture2D(tDiffuse, coords + vec2(0.0, 1.0) * texelSize * fringe * blur).r;\n\tc.g = texture2D(tDiffuse, coords + vec2(-0.866, -0.5) * texelSize * fringe * blur).g;\n\tc.b = texture2D(tDiffuse, coords + vec2(0.866, -0.5) * texelSize * fringe * blur).b;\n\n\t// Calculate the luminance of the constructed colour.\n\tfloat luminance = dot(c.rgb, LUM_COEFF);\n\tfloat threshold = max((luminance - luminanceThreshold) * luminanceGain, 0.0);\n\n\treturn c + mix(vec3(0.0), c, threshold * blur);\n\n}\n\nfloat readDepth(sampler2D depthSampler, vec2 coord) {\n\n\tfloat fragCoordZ = texture2D(depthSampler, coord).x;\n\tfloat viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);\n\n\treturn viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);\n\n}\n\nfloat linearize(float depth) {\n\n\treturn -cameraFar * cameraNear / (depth * (cameraFar - cameraNear) - cameraFar);\n\n}\n\nfloat gather(float i, float j, float ringSamples, inout vec3 color, float w, float h, float blur) {\n\n\tconst float TWO_PI = 6.28318531;\n\n\tfloat step = TWO_PI / ringSamples;\n\tfloat pw = cos(j * step) * i;\n\tfloat ph = sin(j * step) * i;\n\n\t#ifdef PENTAGON\n\n\t\tfloat p = penta(vec2(pw, ph));\n\n\t#else\n\n\t\tfloat p = 1.0;\n\n\t#endif\n\n\tcolor += processTexel(vUv + vec2(pw * w, ph * h), blur) * mix(1.0, i / RINGS_FLOAT, bias) * p;\n\n\treturn mix(1.0, i / RINGS_FLOAT, bias) * p;\n\n}\n\nvoid main() {\n\n\tfloat depth = linearize(readDepth(tDepth, vUv));\n\n\t#ifdef SHADER_FOCUS\n\n\t\tfloat fDepth = linearize(readDepth(tDepth, focusCoords));\n\n\t#else\n\n\t\tfloat fDepth = focalDepth;\n\n\t#endif\n\n\t#ifdef MANUAL_DOF\n\n\t\tconst float nDoFStart = 1.0; \n\t\tconst float nDoFDist = 2.0;\n\t\tconst float fDoFStart = 1.0;\n\t\tconst float fDoFDist = 3.0;\n\n\t\tfloat focalPlane = depth - fDepth;\n\t\tfloat farDoF = (focalPlane - fDoFStart) / fDoFDist;\n\t\tfloat nearDoF = (-focalPlane - nDoFStart) / nDoFDist;\n\n\t\tfloat blur = (focalPlane > 0.0) ? farDoF : nearDoF;\n\n\t#else\n\n\t\tconst float CIRCLE_OF_CONFUSION = 0.03; // 35mm film = 0.03mm CoC.\n\n\t\tfloat focalPlaneMM = fDepth * 1000.0;\n\t\tfloat depthMM = depth * 1000.0;\n\n\t\tfloat focalPlane = (depthMM * focalLength) / (depthMM - focalLength);\n\t\tfloat farDoF = (focalPlaneMM * focalLength) / (focalPlaneMM - focalLength);\n\t\tfloat nearDoF = (focalPlaneMM - focalLength) / (focalPlaneMM * fStop * CIRCLE_OF_CONFUSION);\n\n\t\tfloat blur = abs(focalPlane - farDoF) * nearDoF;\n\n\t#endif\n\n\tblur = clamp(blur, 0.0, 1.0);\n\n\t// Dithering.\n\tvec2 noise = rand(vUv) * ditherStrength * blur;\n\n\tfloat blurFactorX = texelSize.x * blur * maxBlur + noise.x;\n\tfloat blurFactorY = texelSize.y * blur * maxBlur + noise.y;\n\n\tconst int MAX_RING_SAMPLES = RINGS_INT * SAMPLES_INT;\n\n\t// Calculation of final color.\n\tvec4 color;\n\n\tif(blur < 0.05) {\n\n\t\tcolor = texture2D(tDiffuse, vUv);\n\n\t} else {\n\n\t\tcolor = texture2D(tDiffuse, vUv);\n\n\t\tfloat s = 1.0;\n\t\tint ringSamples;\n\n\t\tfor(int i = 1; i <= RINGS_INT; ++i) {\n\n\t\t\tringSamples = i * SAMPLES_INT;\n\n\t\t\t// Constant loop.\n\t\t\tfor(int j = 0; j < MAX_RING_SAMPLES; ++j) {\n\n\t\t\t\t// Break earlier.\n\t\t\t\tif(j >= ringSamples) { break; }\n\n\t\t\t\ts += gather(float(i), float(j), float(ringSamples), color.rgb, blurFactorX, blurFactorY, blur);\n\n\t\t\t}\n\n\t\t}\n\n\t\tcolor.rgb /= s; // Divide by sample count.\n\n\t}\n\n\t#ifdef SHOW_FOCUS\n\n\t\tcolor.rgb = debugFocus(color.rgb, blur, depth);\n\n\t#endif\n\n\t#ifdef VIGNETTE\n\n\t\tcolor.rgb *= vignette();\n\n\t#endif\n\n\tgl_FragColor = color;\n\n}\n";
const vertex = "varying vec2 vUv;\n\nvoid main() {\n\n\tvUv = uv;\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n}\n";

/**
 * Depth of Field shader version 2.
 *
 * Original code by Martins Upitis:
 *  http://blenderartists.org/forum/showthread.php?237488-GLSL-depth-of-field-with-bokeh-v2-4-(update)
 *
 * @class Bokeh2Material
 * @submodule materials
 * @extends ShaderMaterial
 * @constructor
 * @param {PerspectiveCamera} [camera] - The main camera.
 * @param {Object} [options] - Additional options.
 * @param {Vector2} [options.texelSize] - The absolute screen texel size.
 * @param {Boolean} [options.showFocus=false] - Whether the focus point should be highlighted.
 * @param {Boolean} [options.manualDoF=false] - Enables manual depth of field blur.
 * @param {Boolean} [options.vignette=false] - Enables a vignette effect.
 * @param {Boolean} [options.pentagon=false] - Enable to use a pentagonal shape to scale gathered texels.
 * @param {Boolean} [options.shaderFocus=true] - Disable if you compute your own focalDepth (in metres!).
 * @param {Boolean} [options.noise=true] - Disable if you don't want noise patterns for dithering.
 */

export class Bokeh2Material extends THREE.ShaderMaterial {

	constructor(camera, options) {

		if(options === undefined) { options = {}; }
		if(options.rings === undefined) { options.rings = 3; }
		if(options.samples === undefined) { options.samples = 2; }
		if(options.showFocus === undefined) { options.showFocus = false; }
		if(options.showFocus === undefined) { options.showFocus = false; }
		if(options.manualDoF === undefined) { options.manualDoF = false; }
		if(options.vignette === undefined) { options.vignette = false; }
		if(options.pentagon === undefined) { options.pentagon = false; }
		if(options.shaderFocus === undefined) { options.shaderFocus = true; }
		if(options.noise === undefined) { options.noise = true; }

		super({

			type: "Bokeh2Material",

			defines: {

				RINGS_INT: options.rings.toFixed(0),
				RINGS_FLOAT: options.rings.toFixed(1),
				SAMPLES_INT: options.samples.toFixed(0),
				SAMPLES_FLOAT: options.samples.toFixed(1)

			},

			uniforms: {

				tDiffuse: {value: null},
				tDepth: {value: null},

				texelSize: {value: new THREE.Vector2()},
				halfTexelSize: {value: new THREE.Vector2()},

				cameraNear: {value: 0.1},
				cameraFar: {value: 2000},

				focalLength: {value: 24.0},
				fStop: {value: 0.9},

				maxBlur: {value: 1.0},
				luminanceThreshold: {value: 0.5},
				luminanceGain: {value: 2.0},
				bias: {value: 0.5},
				fringe: {value: 0.7},
				ditherStrength: {value: 0.0001},

				focusCoords: {value: new THREE.Vector2(0.5, 0.5)},
				focalDepth: {value: 1.0}

			},

			fragmentShader: fragment,
			vertexShader: vertex

		});

		if(options.showFocus) { this.defines.SHOW_FOCUS = "1"; }
		if(options.manualDoF) { this.defines.MANUAL_DOF = "1"; }
		if(options.vignette) { this.defines.VIGNETTE = "1"; }
		if(options.pentagon) { this.defines.PENTAGON = "1"; }
		if(options.shaderFocus) { this.defines.SHADER_FOCUS = "1"; }
		if(options.noise) { this.defines.NOISE = "1"; }

		if(options.texelSize !== undefined) { this.setTexelSize(options.texelSize.x, options.texelSize.y); }
		if(camera !== undefined) { this.adoptCameraSettings(camera); }

	}

	/**
	 * Sets the texel size.
	 *
	 * @method setTexelSize
	 * @param {Number} x - The texel width.
	 * @param {Number} y - The texel height.
	 */

	setTexelSize(x, y) {

		this.uniforms.texelSize.value.set(x, y);
		this.uniforms.halfTexelSize.value.set(x, y).multiplyScalar(0.5);

	}

	/**
	 * Adopts the near and far plane and the focal length of the given camera.
	 *
	 * @method adoptCameraSettings
	 * @param {PerspectiveCamera} camera - The main camera.
	 */

	adoptCameraSettings(camera) {

		this.uniforms.cameraNear.value = camera.near;
		this.uniforms.cameraFar.value = camera.far;
		this.uniforms.focalLength.value = camera.getFocalLength(); // unit: mm.

	}

}
