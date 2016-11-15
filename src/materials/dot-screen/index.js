const THREE = require('three');

const fragment = "uniform sampler2D tDiffuse;\n\nuniform float angle;\nuniform float scale;\nuniform float intensity;\n\nvarying vec2 vUv;\nvarying vec2 vUvPattern;\n\nfloat pattern() {\n\n\tfloat s = sin(angle);\n\tfloat c = cos(angle);\n\n\tvec2 point = vec2(c * vUvPattern.x - s * vUvPattern.y, s * vUvPattern.x + c * vUvPattern.y) * scale;\n\n\treturn (sin(point.x) * sin(point.y)) * 4.0;\n\n}\n\nvoid main() {\n\n\tvec4 texel = texture2D(tDiffuse, vUv);\n\tvec3 color = texel.rgb;\n\n\t#ifdef AVERAGE\n\n\t\tcolor = vec3((color.r + color.g + color.b) / 3.0);\n\n\t#endif\n\n\tcolor = vec3(color * 10.0 - 5.0 + pattern());\n\tcolor = texel.rgb + (color - texel.rgb) * intensity;\n\n\tgl_FragColor = vec4(color, texel.a);\n\n}\n";
const vertex = "uniform vec4 offsetRepeat;\n\nvarying vec2 vUv;\nvarying vec2 vUvPattern;\n\nvoid main() {\n\n\tvUv = uv;\n\tvUvPattern = uv * offsetRepeat.zw + offsetRepeat.xy;\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n}\n";

/**
 * A dot screen shader material.
 *
 * @class DotScreenMaterial
 * @submodule materials
 * @extends ShaderMaterial
 * @constructor
 * @param {Boolean} [average] - Whether the shader should output the colour average (black and white).
 */

export class DotScreenMaterial extends THREE.ShaderMaterial {

	constructor(average) {

		super({

			type: "DotScreenMaterial",

			uniforms: {

				tDiffuse: {value: null},

				angle: {value: 1.57},
				scale: {value: 1.0},
				intensity: {value: 1.0},

				offsetRepeat: {value: new THREE.Vector4(0.5, 0.5, 1.0, 1.0)}

			},

			fragmentShader: fragment,
			vertexShader: vertex

		});

	}

	if(average) { this.defines.AVERAGE = "1"; }

}
