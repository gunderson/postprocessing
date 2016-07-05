import {
	CombineMaterial
} from "../materials";

import {
	Pass
} from "./pass";
// import THREE from "three";

/**
 * A shader pass.
 *
 * Used to render any shader material as a 2D filter.
 *
 * @class MergePass
 * @submodule passes
 * @extends Pass
 * @constructor
 * @param {MixMaterial} material - The shader material to use when blending branches
 * @param {options} object - includes options for the material
 */

export class MergePass extends Pass {

	constructor(branch, MixMaterial, options) {

		super();

		this.branch = branch;
		this.needsSwap = true;

		if (!(MixMaterial instanceof THREE.ShaderMaterial)) {
			// default to CombineMaterial
			if (typeof combineMaterial === 'object') {
				options = MixMaterial;
			}
			MixMaterial = CombineMaterial;
		}

		this.options = options || {};
		this.options.uniforms = [{
			name: 'texture1',
			type: 't',
			value: null
		}, {
			name: 'texture2',
			type: 't',
			value: null
		}, {
			name: 'opacity1',
			type: 'f',
			value: 1
		}, {
			name: 'opacity2',
			type: 'f',
			value: 0.5
		}];

		this.renderToScreen = this.options.renderToScreen;
		this.material = new MixMaterial();
		this.quad.material = this.material;

	}

	/**
	 * Renders the effect.
	 *
	 * @method render
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {WebGLRenderTarget} readBuffer - The read buffer.
	 * @param {WebGLRenderTarget} writeBuffer - The write buffer.
	 */

	render(renderer, readBuffer, writeBuffer) {
		var texture0 = readBuffer.texture;
		var texture1 = this.branch.originalReadBuffer.texture;

		// distribute defaults and options
		this.options.uniforms.forEach((uniform) => {
			// default textures
			if (uniform.name === 'texture1') {
				this.material.uniforms[uniform.name].value = uniform.value || texture0;

			} else if (uniform.name === 'texture2') {
				this.material.uniforms[uniform.name].value = uniform.value || texture1;
				// fill remaining uniforms
			} else if (this.material.uniforms[uniform.name] !== undefined && uniform.value) {
				this.material.uniforms[uniform.name].value = uniform.value;
			}
		});

		if (this.renderToScreen) {
			renderer.render(this.scene, this.camera);
		} else {
			renderer.render(this.scene, this.camera, writeBuffer, this.clear);
		}
	}
}
