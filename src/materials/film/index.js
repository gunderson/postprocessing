const THREE = require('three');

const fragment = "uniform sampler2D tDiffuse;\nuniform float time;\n\nvarying vec2 vUv;\n\n#ifdef NOISE\n\n\tuniform float noiseIntensity;\n\n#endif\n\n#ifdef SCANLINES\n\n\tuniform float scanlineIntensity;\n\tuniform float scanlineCount;\n\n#endif\n\n#ifdef GREYSCALE\n\n\tuniform float greyscaleIntensity;\n\n\tconst vec3 LUM_COEFF = vec3(0.299, 0.587, 0.114);\n\n#elif defined(SEPIA)\n\n\tuniform float sepiaIntensity;\n\n#endif\n\n#ifdef VIGNETTE\n\n\tuniform float vignetteOffset;\n\tuniform float vignetteDarkness;\n\n#endif\n\nvoid main() {\n\n\tvec4 texel = texture2D(tDiffuse, vUv);\n\tvec3 color = texel.rgb;\n\n\t#ifdef NOISE\n\n\t\tfloat x = vUv.x * vUv.y * time * 1000.0;\n\t\tx = mod(x, 13.0) * mod(x, 123.0);\n\t\tx = mod(x, 0.01);\n\n\t\tcolor += texel.rgb * clamp(0.1 + x * 100.0, 0.0, 1.0) * noiseIntensity;\n\n\t#endif\n\n\t#ifdef SCANLINES\n\n\t\tvec2 sl = vec2(sin(vUv.y * scanlineCount), cos(vUv.y * scanlineCount));\n\t\tcolor += texel.rgb * vec3(sl.x, sl.y, sl.x) * scanlineIntensity;\n\n\t#endif\n\n\t#ifdef GREYSCALE\n\n\t\tcolor = mix(color, vec3(dot(color, LUM_COEFF)), greyscaleIntensity);\n\n\t#elif defined(SEPIA)\n\n\t\tvec3 c = color.rgb;\n\n\t\tcolor.r = dot(c, vec3(1.0 - 0.607 * sepiaIntensity, 0.769 * sepiaIntensity, 0.189 * sepiaIntensity));\n\t\tcolor.g = dot(c, vec3(0.349 * sepiaIntensity, 1.0 - 0.314 * sepiaIntensity, 0.168 * sepiaIntensity));\n\t\tcolor.b = dot(c, vec3(0.272 * sepiaIntensity, 0.534 * sepiaIntensity, 1.0 - 0.869 * sepiaIntensity));\n\n\t#endif\n\n\t#ifdef VIGNETTE\n\n\t\tconst vec2 CENTER = vec2(0.5);\n\n\t\t#ifdef ESKIL\n\n\t\t\tvec2 uv = (vUv - CENTER) * vec2(vignetteOffset);\n\t\t\tcolor = mix(color.rgb, vec3(1.0 - vignetteDarkness), dot(uv, uv));\n\n\t\t#else\n\n\t\t\tfloat dist = distance(vUv, CENTER);\n\t\t\tcolor *= smoothstep(0.8, vignetteOffset * 0.799, dist * (vignetteDarkness + vignetteOffset));\n\n\t\t#endif\t\t\n\n\t#endif\n\n\tgl_FragColor = vec4(clamp(color, 0.0, 1.0), texel.a);\n\n}\n";
const vertex = "varying vec2 vUv;\n\nvoid main() {\n\n\tvUv = uv;\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n}\n";

/**
 * A cinematic shader that provides the following effects:
 *  - Film Grain
 *  - Scanlines
 *  - Vignette
 *  - Greyscale
 *  - Sepia
 *
 * Original scanlines algorithm by Pat "Hawthorne" Shearon.
 *  http://www.truevision3d.com/forums/showcase/staticnoise_colorblackwhite_scanline_shaders-t18698.0.html
 *
 * Optimized scanlines and noise with intensity scaling by Georg "Leviathan" 
 * Steinrohder. (This version is provided under a Creative Commons Attribution 
 * 3.0 License: http://creativecommons.org/licenses/by/3.0)
 *
 * The sepia effect is based on:
 *  https://github.com/evanw/glfx.js
 *
 * The vignette code is based on PaintEffect postprocess from ro.me:
 *  http://code.google.com/p/3-dreams-of-black/source/browse/deploy/js/effects/PaintEffect.js
 *
 * @class FilmMaterial
 * @submodule materials
 * @extends ShaderMaterial
 * @constructor
 * @param {Object} [options] - The options.
 * @param {Boolean} [options.greyscale=false] - Enable greyscale effect. Greyscale and sepia are mutually exclusive.
 * @param {Boolean} [options.sepia=false] - Enable sepia effect. Greyscale and sepia are mutually exclusive.
 * @param {Boolean} [options.vignette=false] - Apply vignette effect.
 * @param {Boolean} [options.eskil=false] - Use Eskil's vignette approach. The default looks dusty while Eskil looks burned out.
 * @param {Boolean} [options.scanlines=true] - Show scanlines.
 * @param {Boolean} [options.noise=true] - Show noise-based film grain.
 * @param {Number} [options.noiseIntensity=0.5] - The noise intensity. 0.0 to 1.0.
 * @param {Number} [options.scanlineIntensity=0.05] - The scanline intensity. 0.0 to 1.0.
 * @param {Number} [options.greyscaleIntensity=1.0] - The intensity of the greyscale effect.
 * @param {Number} [options.sepiaIntensity=1.0] - The intensity of the sepia effect.
 * @param {Number} [options.vignetteOffset=1.0] - The offset of the vignette effect.
 * @param {Number} [options.vignetteDarkness=1.0] - The darkness of the vignette effect.
 */

export class FilmMaterial extends THREE.ShaderMaterial {

	constructor(options) {

		if(options === undefined) { options = {}; }

		super({

			type: "FilmMaterial",

			uniforms: {

				tDiffuse: {value: null},
				time: {value: 0.0},

				noiseIntensity: {value: (options.noiseIntensity !== undefined) ? options.noiseIntensity : 0.5},
				scanlineIntensity: {value: (options.scanlineIntensity !== undefined) ? options.scanlineIntensity : 0.05},
				scanlineCount: {value: 0.0},

				greyscaleIntensity: {value: (options.greyscaleIntensity !== undefined) ? options.greyscaleIntensity : 1.0},
				sepiaIntensity: {value: (options.sepiaIntensity !== undefined) ? options.sepiaIntensity : 1.0},

				vignetteOffset: {value: (options.vignetteOffset !== undefined) ? options.vignetteOffset : 1.0},
				vignetteDarkness: {value: (options.vignetteDarkness !== undefined) ? options.vignetteDarkness : 1.0}

			},

			fragmentShader: fragment,
			vertexShader: vertex

		});

		// These are enabled by default.
		if(options.scanlines === undefined || options.scanlines) { this.defines.SCANLINES = "1"; }
		if(options.noise === undefined || options.noise) { this.defines.NOISE = "1"; }

		if(options.greyscale) { this.defines.GREYSCALE = "1"; }
		if(options.sepia) { this.defines.SEPIA = "1"; }
		if(options.vignette) { this.defines.VIGNETTE = "1"; }
		if(options.eskil) { this.defines.ESKIL = "1"; }

	}

}
