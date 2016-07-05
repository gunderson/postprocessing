import THREE from "three";

const fragment = "uniform sampler2D texture1;\nuniform sampler2D texture2;\n\nuniform float opacity1;\nuniform float opacity2;\n\nvarying vec2 vUv;\n\nvoid main() {\n\n\tvec4 texel1 = texture2D(texture1, vUv);\n\tvec4 texel2 = texture2D(texture2, vUv);\n\n\t#ifdef INVERT_TEX1\n\n\t\ttexel1.rgb = vec3(1.0) - texel1.rgb;\n\n\t#endif\n\n\t#ifdef INVERT_TEX2\n\n\t\ttexel2.rgb = vec3(1.0) - texel2.rgb;\n\n\t#endif\n\n\tgl_FragColor = opacity1 * texel1 + opacity2 * texel2;\n\n}\n";
const vertex = "varying vec2 vUv;\n\nvoid main() {\n\n\tvUv = uv;\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n}\n";

/**
 * A material for combining two textures.
 *
 * @class CombineMaterial
 * @submodule materials
 * @extends ShaderMaterial
 * @constructor
 * @param {Boolean} [invertTexture1=false] - Invert the first texture's rgb values.
 * @param {Boolean} [invertTexture2=false] - Invert the second texture's rgb values.
 */

export class CombineMaterial extends THREE.ShaderMaterial {

	constructor(invertTexture1, invertTexture2) {

		super({

			type: "CombineMaterial",

			uniforms: {

				texture1: {value: null},
				texture2: {value: null},

				opacity1: {value: 1.0},
				opacity2: {value: 1.0}

			},

			fragmentShader: fragment,
			vertexShader: vertex

		});

		if(invertTexture1) { this.defines.INVERT_TEX1 = "1"; }
		if(invertTexture2) { this.defines.INVERT_TEX2 = "1"; }

	}

}
