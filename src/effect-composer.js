import {
	BranchPass,
	MergePass
} from "./passes";

import {
	Branch
} from "./branch";

/**
 * The EffectComposer may be used in place of a normal WebGLRenderer.
 *
 * It will disable the auto clear behaviour of the provided renderer to prevent
 * unnecessary clear operations. The depth buffer will also be disabled for
 * writing. Passes that rely on the depth test must explicitly enable it.
 *
 * You may want to use a {{#crossLink "RenderPass"}}{{/crossLink}} as your first
 * pass to automatically clear the screen and render the scene to a texture for
 * further processing.
 *
 * @class EffectComposer
 * @module postprocessing
 * @constructor
 * @param {WebGLRenderer} [renderer] - The renderer that should be used in the passes.
 * @param {Boolean} [depthTexture=false] - Set to true, if one of your passes relies on the depth of the main scene.
 * @param {Boolean} [stencilBuffer=false] - Whether the main render targets should have a stencil buffer.
 */

export class EffectComposer {

	constructor(renderer, depthTexture, stencilBuffer) {
		/**
		 * The render branches
		 *
		 * @property branches
		 * @type object
		 * @private
		 */
		this.renderer = renderer;
		this.branches = {};
		// keep existing constructor syntax for backward compatibility
		this.branch(renderer, 'main', {
			depthTexture,
			stencilBuffer
		});

		// moved the rest of this function to Branch

		// make chainable
		return this;
	}

	/**
	 * Adds a pass, optionally at a specific index.
	 *
	 * @method addPass
	 * @param {Pass} pass - A new pass.
	 * @param {Number} [index] - An index at which the pass should be inserted.
	 */

	addPass(pass, index, branchName) {
		branchName = branchName || 'main';
		let branch = this.branches[branchName];
		if (!branch) {
			// automatically create a new branch if one doesn't exist
			branch = this.branch(this.renderer, branchName);
		}

		branch.addPass(pass, index, branchName);
		return this;
	}


	/**
	 * Creates a branched render chain
	 *
	 * @method branch
	 * @param {String} [branchName='branch'] - Name of the branch
	 * @param {WebGLRenderer || WebGLRenderTarget} [renderer] - the renderer to draw from
	 * @param {Object} [options] - an options hash
	 */

	branch(renderer, branchName, options) {
		renderer = renderer || this.renderer;
		branchName = branchName || 'branch';
		options = options || {};

		if (this.branches[branchName]) {
			// if branchname already exists, increment and create a new branch
			let i = 0;
			let newBranchName = branchName;
			while (this.branches[newBranchName]) {
				newBranchName = `${branchName}_${++i}`;
			}
			branchName = newBranchName;
			// throw new Error(`Branch "${branchName}" already exists`);
		}
		// register branch
		let branch = this.branches[branchName] = new Branch(renderer, branchName, options);
		this.addPass(new BranchPass(branch), null, branchName);

		if (options.chain === false) { return branch; }
		return this;
	}

	/**
	 * Merges a branched render chain back to the chain from which it was branched
	 *
	 * Sets the result of the render chain as its writeBuffer, and sets the value as a texture
	 * in the subsequent pass
	 *
	 * @method merge
	 * @param {String} [branchName='branch'] - Name of the branch
	 * @param {String} [textureName='texture0'] - Name of the texture to give to next pass
	 */

	merge(branchFrom, branchTo, combineShader, options) {
		// recall branch or allow to pass a branch directly
		branchFrom = branchFrom instanceof Branch ? branchFrom : this.branches[branchFrom];
		branchTo = branchTo instanceof Branch ? branchTo : this.branches[branchTo];
		if (!branchFrom) {
			throw new Error(`Branch "${branchFrom}" does not exist.`, branchFrom);
		}
		if (!branchTo) {
			throw new Error(`Branch "${branchTo}" does not exist.`, branchTo);
		}
		this.addPass(new MergePass(branchFrom, branchTo, combineShader, options));
		return this;
	}

	/**
	 * Removes a pass.
	 *
	 * @method removePass
	 * @param {Pass} pass - The pass.
	 */

	removePass(pass, branchName) {

		branchName = branchName || 'main';

		this.branches[branchName].passes.splice(this.branches[branchName].passes.indexOf(pass), 1);

	}

	/**
	 * Renders all enabled passes in the order in which they were added.
	 *
	 * @method render
	 * @param {Number} delta - The time between the last frame and the current one in seconds.
	 */

	render(delta) {
		this.branches.main.render(delta);

		return this;

	}

	/**
	 * Sets the size of the buffers and the renderer's output canvas.
	 *
	 * Every pass in every branch will be informed of the new size. It's up to each
	 * pass how that information is used.
	 *
	 * If no width or height is specified, the render targets and passes will be
	 * updated with the current size of the renderer.
	 *
	 * @method setSize
	 * @param {Number} [width] - The width.
	 * @param {Number} [height] - The height.
	 */

	setSize(width, height) {

		for (let key in this.branches) {

			this.branches[key].setSize(width, height);

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

		for (let key in this.branches) {

			this.branches[key].dispose(renderTarget);

		}

		return this;
	}

	/**
	 * Destroys all branches ,passes and render targets.
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

		for (let key in this.branches) {

			this.branches[key].dispose(renderTarget);

		}

		this.branches = {};

		return this;
	}

}
