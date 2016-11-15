const THREE = require('three');

const fragment = "uniform sampler2D tDiffuse;\nuniform float opacity;\n\nvarying vec2 vUv;\n\nvoid main() {\n\n\tvec4 texel = texture2D(tDiffuse, vUv);\n\tgl_FragColor = opacity * texel;\n\n}\n";
const vertex = "varying vec2 vUv;\n\nvoid main() {\n\n\tvUv = uv;\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n}\n";

/**
 * A simple copy shader material.
 *
 * @class CopyMaterial
 * @submodule materials
 * @extends ShaderMaterial
 * @constructor
 */

export class CopyMaterial extends THREE.ShaderMaterial {

	constructor() {

		super({

			type: "CopyMaterial",

			uniforms: {

				tDiffuse: {value: null},
				opacity: {value: 1.0}

			},

			fragmentShader: fragment,
			vertexShader: vertex

		});

	}

}
