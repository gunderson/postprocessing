import {
	ClearMaskPass,
	MaskPass,
	ShaderPass
} from "./passes";

import {
	CopyMaterial
} from "./materials";
import THREE from "three";

/**
 * A Branch is an independant render chain that passes the last pass in its chain as a texture to a MergePass
 *
 * A Branch is created automatically in the constructor of {{#crossLink "EffectComposer"}}{{/crossLink}}
 *
 * All parameters are optional and subsequent parameters will be shifted into place automatically.
 *
 * @class Branch
 * @module postprocessing
 * @constructor
 * @param {String} [name='branch'] - Set to true, if one of your passes relies on the depth of the main scene.
 * @param {WebGLRenderer} [renderer] - The renderer that should be used in the passes for this Branch.
 * @param {Object} [options] - Whether the main render targets should have a stencil buffer.
 */

export class Branch {
	constructor(...args) {
		let renderer, name, options;

		// check parameters and shift args if any have been omitted
		if (args[0] instanceof THREE.WebGLRenderer) {
			renderer = args[0];
			args.shift();
		}
		if (typeof args[0] === 'string') {
			name = args[0];
			args.shift();
		}
		if (typeof args[0] === 'object') {
			options = args[0];
			args.shift();
		}

		// set default values for parameters if not set through arguments or through options object
		options = options || {};

		options.name = name || options.name || 'branch';
		options.renderer = renderer || options.renderer || new THREE.WebGLRenderer();

		if (options.depthTexture === undefined) {
			options.depthTexture = false;
		}
		if (options.stencilBuffer === undefined) {
			options.stencilBuffer = false;
		}


		// propagate options to this
		for (let key in options) {
			this[key] = options[key];
		}

		/**
		 * The renderer.
		 *
		 * @property renderer
		 * @type WebGLRenderer
		 */

		this.renderer.autoClear = options.autoclear || false;
		// this.renderer.state.setDepthWrite(false);
		this.renderer.state.setDepthWrite(this.depthTexture);

		/**
		 * The read buffer.
		 *
		 * Reading from and writing to the same render target should be avoided.
		 * Therefore, two seperate, yet identical buffers are used.
		 *
		 * @property readBuffer
		 * @type WebGLRenderTarget
		 * @private
		 */

		this.readBuffer = this.createBuffer(this.stencilBuffer);
		this.readBuffer.texture.generateMipmaps = false;

		/**
		 * The write buffer.
		 *
		 * @property writeBuffer
		 * @type WebGLRenderTarget
		 * @private
		 */

		this.writeBuffer = this.readBuffer.clone();

		if (this.depthTexture) {
			this.readBuffer.depthTexture = this.writeBuffer.depthTexture = new THREE.DepthTexture();
		}

		/**
		 * A copy pass used for copying masked scenes.
		 *
		 * @property copyPass
		 * @type ShaderPass
		 * @private
		 */

		this.copyPass = new ShaderPass(new CopyMaterial());

		/**
		 * The render passes
		 *
		 * @property passes
		 * @type Array
		 * @private
		 */

		this.passes = [];

	}

	/**
	 * Creates a new render target by replicating the renderer's canvas.
	 *
	 * @method createBuffer
	 * @param {Boolean} stencilBuffer - Whether the render target should have a stencil buffer.
	 * @return {WebGLRenderTarget} A fresh render target that equals the renderer's canvas.
	 */

	createBuffer(stencilBuffer) {

		let size = this.renderer.getSize();
		let alpha = this.renderer.context.getContextAttributes()
			.alpha;

		return new THREE.WebGLRenderTarget(size.width, size.height, {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			format: alpha ? THREE.RGBAFormat : THREE.RGBFormat,
			stencilBuffer: stencilBuffer
		});
	}

	/**
	 * Renders all enabled passes in the order in which they were added.
	 *
	 * @method render
	 * @param {Number} delta - The time between the last frame and the current one in seconds.
	 */

	render(delta) {
		let readBuffer = this.readBuffer;
		let writeBuffer = this.writeBuffer;

		let maskActive = false;
		let i, l, pass, buffer;
		let ctx, state;

		for (i = 0, l = this.passes.length; i < l; ++i) {
			pass = this.passes[i];
			if (pass.enabled) {
				pass.render(this.renderer, readBuffer, writeBuffer, delta, maskActive);
				if (pass.needsSwap) {
					if (maskActive) {
						ctx = this.renderer.context;
						state = this.renderer.state;
						state.setStencilFunc(ctx.NOTEQUAL, 1, 0xffffffff);
						this.copyPass.render(this.renderer, readBuffer, writeBuffer);
						state.setStencilFunc(ctx.EQUAL, 1, 0xffffffff);
					}
					buffer = readBuffer;
					readBuffer = writeBuffer;
					writeBuffer = buffer;
				}

				if (pass instanceof MaskPass) {
					maskActive = true;
				} else if (pass instanceof ClearMaskPass) {
					maskActive = false;
				}
			}
		}
		return this;
	}

	/**
	 * Adds a pass, optionally at a specific index.
	 *
	 * @method addPass
	 * @param {Pass} pass - A new pass.
	 * @param {Number} [index] - An index at which the pass should be inserted.
	 */

	addPass(pass, index) {
		pass.initialise(this.renderer, this.renderer.context.getContextAttributes()
			.alpha);

		if (index !== undefined) {

			this.passes.splice(index, 0, pass);

		} else {

			this.passes.push(pass);

		}
		return this;

	}

	/**
	 * Sets the size of the buffers and the renderer's output canvas.
	 *
	 * Every pass will be informed of the new size. It's up to each pass how that
	 * information is used.
	 *
	 * If no width or height is specified, the render targets and passes will be
	 * updated with the current size of the renderer.
	 *
	 * @method setSize
	 * @param {Number} [width] - The width.
	 * @param {Number} [height] - The height.
	 */

	setSize(width, height) {

		let i, l;
		let size;

		if (width === undefined || height === undefined) {

			size = this.renderer.getSize();
			width = size.width;
			height = size.height;

		}

		this.renderer.setSize(width, height);
		this.readBuffer.setSize(width, height);
		this.writeBuffer.setSize(width, height);


		for (i = 0, l = this.passes.length; i < l; ++i) {
			this.passes[i].setSize(width, height);
		}

		return this;
	}


	/**
	 * Resets this composer by deleting all passes and creating new buffers.
	 *
	 * @method reset
	 * @param {WebGLRenderTarget} [renderTarget] - A new render target to use. If none is provided, the settings of the renderer will be used.
	 */

	reset(renderTarget) {

		this.dispose((renderTarget === undefined) ? this.createBuffer() : renderTarget);

		return this;
	}

	/**
	 * Destroys all passes and render targets.
	 *
	 * This method deallocates all render targets, textures and materials created
	 * by the passes. It also deletes this composer's frame buffers.
	 *
	 * Note: the reset method uses the dispose method internally.
	 *
	 * @method dispose
	 * @param {WebGLRenderTarget} [renderTarget] - A new render target. If none is provided, the composer will become inoperative.
	 */

	dispose(renderTarget) {

		this.readBuffer.dispose();
		this.writeBuffer.dispose();

		this.readBuffer = this.writeBuffer = null;

		while (this.branches.main.passes.length > 0) {

			this.branches.main.passes.pop()
				.dispose();

		}

		if (renderTarget !== undefined) {

			// Reanimate.
			this.readBuffer = renderTarget;
			this.writeBuffer = this.readBuffer.clone();

		} else {

			this.copyPass.dispose();

		}

		return this;
	}
}
