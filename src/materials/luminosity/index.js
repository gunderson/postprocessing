import THREE from "three";

const fragment = "uniform sampler2D tDiffuse;\nuniform float distinction;\nuniform vec2 range;\n\nvarying vec2 vUv;\n\nvoid main() {\n\n\tconst vec4 LUM_COEFF = vec4(0.299, 0.587, 0.114, 0.0);\n\n\tvec4 texel = texture2D(tDiffuse, vUv);\n\tfloat v = dot(texel, LUM_COEFF);\n\n\t#ifdef RANGE\n\n\t\tfloat low = step(range.x, v);\n\t\tfloat high = step(v, range.y);\n\n\t\t// Apply the mask.\n\t\tv *= low * high;\n\n\t#endif\n\n\tv = pow(abs(v), distinction);\n\n\t#ifdef COLOR\n\n\t\tgl_FragColor = vec4(texel.rgb * v, texel.a);\n\n\t#else\n\n\t\tgl_FragColor = vec4(v, v, v, texel.a);\n\n\t#endif\n\n}\n";
const vertex = "varying vec2 vUv;\n\nvoid main() {\n\n\tvUv = uv;\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n}\n";

/**
 * A luminance shader material.
 *
 * This shader produces a greyscale luminance map. It can also be configured to 
 * output colors that are scaled with their respective luminance value. 
 * Additionally, a range may be provided to mask out undesired texels.
 *
 * The alpha channel will remain unaffected in all cases.
 *
 * Luminance range reference:
 *  https://cycling74.com/2007/05/23/your-first-shader/#.Vty9FfkrL4Z
 *
 * @class LuminosityMaterial
 * @submodule materials
 * @extends ShaderMaterial
 * @constructor
 * @params {Boolean} [color=false] - Defines whether the shader should output colours scaled with their luminance value.
 * @params {Vector2} [range] - If provided, the shader will mask out texels that aren't in the specified range.
 */

export class LuminosityMaterial extends THREE.ShaderMaterial {

	constructor(color, range) {

		super({

			type: "LuminosityMaterial",

			uniforms: {

				tDiffuse: {value: null},
				distinction: {value: 1.0},
				range: {value: (range !== undefined) ? range : new THREE.Vector2()}

			},

			fragmentShader: fragment,
			vertexShader: vertex

		});

		if(color !== undefined) { this.defines.COLOR = "1"; }
		if(range !== undefined) { this.defines.RANGE = "1"; }

	}

}
