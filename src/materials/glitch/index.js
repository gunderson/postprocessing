import THREE from "three";

const fragment = "uniform sampler2D tDiffuse;\nuniform sampler2D tPerturb;\n\nuniform bool active;\n\nuniform float amount;\nuniform float angle;\nuniform float seed;\nuniform float seedX;\nuniform float seedY;\nuniform float distortionX;\nuniform float distortionY;\nuniform float colS;\n\nvarying vec2 vUv;\n\nfloat rand(vec2 tc) {\n\n\tconst float a = 12.9898;\n\tconst float b = 78.233;\n\tconst float c = 43758.5453;\n\n\tfloat dt = dot(tc, vec2(a, b));\n\tfloat sn = mod(dt, 3.14);\n\n\treturn fract(sin(sn) * c);\n\n}\n\nvoid main() {\n\n\tvec2 coord = vUv;\n\n\tfloat xs, ys;\n\tvec4 normal;\n\n\tvec2 offset;\n\tvec4 cr, cga, cb;\n\tvec4 snow, color;\n\n\tfloat sx, sy;\n\n\tif(active) {\n\n\t\txs = floor(gl_FragCoord.x / 0.5);\n\t\tys = floor(gl_FragCoord.y / 0.5);\n\n\t\tnormal = texture2D(tPerturb, coord * seed * seed);\n\n\t\tif(coord.y < distortionX + colS && coord.y > distortionX - colS * seed) {\n\n\t\t\tsx = clamp(ceil(seedX), 0.0, 1.0);\n\t\t\tcoord.y = sx * (1.0 - (coord.y + distortionY)) + (1.0 - sx) * distortionY;\n\n\t\t}\n\n\t\tif(coord.x < distortionY + colS && coord.x > distortionY - colS * seed) {\n\n\t\t\tsy = clamp(ceil(seedY), 0.0, 1.0);\n\t\t\tcoord.x = sy * distortionX + (1.0 - sy) * (1.0 - (coord.x + distortionX));\n\n\t\t}\n\n\t\tcoord.x += normal.x * seedX * (seed / 5.0);\n\t\tcoord.y += normal.y * seedY * (seed / 5.0);\n\n\t\toffset = amount * vec2(cos(angle), sin(angle));\n\n\t\tcr = texture2D(tDiffuse, coord + offset);\n\t\tcga = texture2D(tDiffuse, coord);\n\t\tcb = texture2D(tDiffuse, coord - offset);\n\n\t\tcolor = vec4(cr.r, cga.g, cb.b, cga.a);\n\t\tsnow = 200.0 * amount * vec4(rand(vec2(xs * seed, ys * seed * 50.0)) * 0.2);\n\t\tcolor += snow;\n\n\t} else {\n\n\t\tcolor = texture2D(tDiffuse, vUv);\n\n\t}\n\n\tgl_FragColor = color;\n\n}\n";
const vertex = "varying vec2 vUv;\n\nvoid main() {\n\n\tvUv = uv;\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n}\n";

/**
 * A glitch shader material.
 *
 * Reference:
 *  https://github.com/staffantan/unityglitch
 *
 * @class GlitchMaterial
 * @submodule materials
 * @extends ShaderMaterial
 * @constructor
 */

export class GlitchMaterial extends THREE.ShaderMaterial {

	constructor() {

		super({

			type: "GlitchMaterial",

			uniforms: {

				tDiffuse: {value: null},
				tPerturb: {value: null},

				active: {value: 1},

				amount: {value: 0.8},
				angle: {value: 0.02},
				seed: {value: 0.02},
				seedX: {value: 0.02},
				seedY: {value: 0.02},
				distortionX: {value: 0.5},
				distortionY: {value: 0.6},
				colS: {value: 0.05}

			},

			fragmentShader: fragment,
			vertexShader: vertex

		});

	}

}
