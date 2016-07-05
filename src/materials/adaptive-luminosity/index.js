import THREE from "three";

const fragment = "uniform sampler2D tPreviousLum;\nuniform sampler2D tCurrentLum;\nuniform float delta;\nuniform float tau;\n\nvarying vec2 vUv;\n\nvoid main() {\n\n\tfloat previousLum = texture2D(tPreviousLum, vUv, MIP_LEVEL_1X1).r;\n\tfloat currentLum = texture2D(tCurrentLum, vUv, MIP_LEVEL_1X1).r;\n\n\t// Adapt the luminance using Pattanaik's technique.\n\tfloat adaptedLum = previousLum + (currentLum - previousLum) * (1.0 - exp(-delta * tau));\n\n\tgl_FragColor = vec4(adaptedLum, adaptedLum, adaptedLum, 1.0);\n\n}\n";
const vertex = "varying vec2 vUv;\n\nvoid main() {\n\n\tvUv = uv;\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n}\n";

/**
 * An adaptive luminosity shader material.
 *
 * @class AdaptiveLuminosityMaterial
 * @submodule materials
 * @extends ShaderMaterial
 * @constructor
 */

export class AdaptiveLuminosityMaterial extends THREE.ShaderMaterial {

	constructor() {

		super({

			type: "AdaptiveLuminosityMaterial",

			defines: {

				MIP_LEVEL_1X1: "0.0"

			},

			uniforms: {

				tPreviousLum: {value: null},
				tCurrentLum: {value: null},
				delta: {value: 0.0},
				tau: {value: 1.0}

			},

			fragmentShader: fragment,
			vertexShader: vertex

		});

	}

}
