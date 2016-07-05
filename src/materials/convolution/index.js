import THREE from "three";

const fragment = "uniform sampler2D tDiffuse;\n\nvarying vec2 vUv0;\nvarying vec2 vUv1;\nvarying vec2 vUv2;\nvarying vec2 vUv3;\n\nvoid main() {\n\n\t// Sample top left texel.\n\tvec4 sum = texture2D(tDiffuse, vUv0);\n\n\t// Sample top right texel.\n\tsum += texture2D(tDiffuse, vUv1);\n\n\t// Sample bottom right texel.\n\tsum += texture2D(tDiffuse, vUv2);\n\n\t// Sample bottom left texel.\n\tsum += texture2D(tDiffuse, vUv3);\n\n\t// Compute the average.\n\tgl_FragColor = sum * 0.25;\n\n}\n";
const vertex = "uniform vec2 texelSize;\nuniform vec2 halfTexelSize;\nuniform float kernel;\n\nvarying vec2 vUv0;\nvarying vec2 vUv1;\nvarying vec2 vUv2;\nvarying vec2 vUv3;\n\nvoid main() {\n\n\tvec2 dUv = (texelSize * vec2(kernel)) + halfTexelSize;\n\n\tvUv0 = vec2(uv.x - dUv.x, uv.y + dUv.y);\n\tvUv1 = vec2(uv.x + dUv.x, uv.y + dUv.y);\n\tvUv2 = vec2(uv.x + dUv.x, uv.y - dUv.y);\n\tvUv3 = vec2(uv.x - dUv.x, uv.y - dUv.y);\n\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n}\n";

/**
 * A convolution blur shader material.
 *
 * Use this shader five times in a row while adjusting the kernel before each 
 * render call in order to get a result similar to a 35x35 Gauss filter.
 *
 * Based on the GDC2003 Presentation by Masaki Kawase, Bunkasha Games:
 * Frame Buffer Postprocessing Effects in DOUBLE-S.T.E.A.L (Wreckless)
 *
 * Further modified according to:
 *  https://developer.apple.com/library/ios/documentation/3DDrawing/Conceptual/OpenGLES_ProgrammingGuide/BestPracticesforShaders/BestPracticesforShaders.html#//apple_ref/doc/uid/TP40008793-CH7-SW15
 *
 * @class ConvolutionMaterial
 * @submodule materials
 * @extends ShaderMaterial
 * @constructor
 * @param {Vector2} [texelSize] - The absolute screen texel size.
 */

export class ConvolutionMaterial extends THREE.ShaderMaterial {

	constructor(texelSize) {

		super({

			type: "ConvolutionMaterial",

			uniforms: {

				tDiffuse: {value: null},
				texelSize: {value: new THREE.Vector2()},
				halfTexelSize: {value: new THREE.Vector2()},
				kernel: {value: 0.0}

			},

			fragmentShader: fragment,
			vertexShader: vertex

		});

		/**
		 * The Kawase blur kernels for five consecutive convolution passes.
		 * The result matches the 35x35 Gauss filter.
		 *
		 * @property kernels
		 * @type Number
		 * @private
		 */

		this.kernels = new Float32Array([0.0, 1.0, 2.0, 2.0, 3.0]);

		/**
		 * Scales the kernels.
		 *
		 * @property scale
		 * @type Number
		 * @default 1.0
		 */

		this.scale = 1.0;

		/**
		 * The current kernel.
		 *
		 * @property currentKernel
		 * @type Number
		 * @private
		 */

		this.currentKernel = 0;

		if(texelSize !== undefined) { this.setTexelSize(texelSize.x, texelSize.y); }

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
	 * Adjusts the kernel for the next blur pass.
	 * Call this method before each render iteration.
	 *
	 * @method adjustKernel
	 */

	adjustKernel() {

		this.uniforms.kernel.value = this.kernels[this.currentKernel] * this.scale;
		if(++this.currentKernel >= this.kernels.length) { this.currentKernel = 0; }

	}

}
