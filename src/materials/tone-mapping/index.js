const THREE = require('three');

const fragment = "uniform sampler2D tDiffuse;\nuniform float middleGrey;\nuniform float maxLuminance;\n\n#ifdef ADAPTED_LUMINANCE\n\n\tuniform sampler2D luminanceMap;\n\n#else\n\n\tuniform float averageLuminance;\n\n#endif\n\nvarying vec2 vUv;\n\nconst vec3 LUM_COEFF = vec3(0.299, 0.587, 0.114);\nconst vec2 CENTER = vec2(0.5, 0.5);\n\nvec3 toneMap(vec3 c) {\n\n\t#ifdef ADAPTED_LUMINANCE\n\n\t\t// Get the calculated average luminance.\n\t\tfloat lumAvg = texture2D(luminanceMap, CENTER).r;\n\n\t#else\n\n\t\tfloat lumAvg = averageLuminance;\n\n\t#endif\n\n\t// Calculate the luminance of the current pixel.\n\tfloat lumPixel = dot(c, LUM_COEFF);\n\n\t// Apply the modified operator (Reinhard Eq. 4).\n\tfloat lumScaled = (lumPixel * middleGrey) / lumAvg;\n\n\tfloat lumCompressed = (lumScaled * (1.0 + (lumScaled / (maxLuminance * maxLuminance)))) / (1.0 + lumScaled);\n\n\treturn lumCompressed * c;\n\n}\n\nvoid main() {\n\n\tvec4 texel = texture2D(tDiffuse, vUv);\n\tgl_FragColor = vec4(toneMap(texel.rgb), texel.a);\n\n}\n";
const vertex = "varying vec2 vUv;\n\nvoid main() {\n\n\tvUv = uv;\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n}\n";

/**
 * Full-screen tone-mapping shader material.
 *
 * Reference:
 *  http://www.graphics.cornell.edu/~jaf/publications/sig02_paper.pdf
 *
 * @class ToneMappingMaterial
 * @submodule materials
 * @extends ShaderMaterial
 * @constructor
 */

export class ToneMappingMaterial extends THREE.ShaderMaterial {

	constructor() {

		super({

			type: "ToneMappingMaterial",

			uniforms: {

				tDiffuse: {value: null},
				luminanceMap: {value: null},
				averageLuminance: {value: 1.0},
				maxLuminance: {value: 16.0},
				middleGrey: {value: 0.6}

			},

			fragmentShader: fragment,
			vertexShader: vertex

		});

	}

}
