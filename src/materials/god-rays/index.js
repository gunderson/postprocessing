import THREE from "three";

const fragment = "uniform sampler2D tDiffuse;\nuniform vec3 lightPosition;\n\nuniform float exposure;\nuniform float decay;\nuniform float density;\nuniform float weight;\nuniform float clampMax;\n\nvarying vec2 vUv;\n\nvoid main() {\n\n\tvec2 texCoord = vUv;\n\n\t// Calculate vector from pixel to light source in screen space.\n\tvec2 deltaTexCoord = texCoord - lightPosition.st;\n\tdeltaTexCoord *= 1.0 / NUM_SAMPLES_FLOAT * density;\n\n\t// A decreasing illumination factor.\n\tfloat illuminationDecay = 1.0;\n\n\tvec4 sample;\n\tvec4 color = vec4(0.0);\n\n\t// Estimate the probability of occlusion at each pixel by summing samples along a ray to the light source.\n\tfor(int i = 0; i < NUM_SAMPLES_INT; ++i) {\n\n\t\ttexCoord -= deltaTexCoord;\n\t\tsample = texture2D(tDiffuse, texCoord);\n\n\t\t// Apply sample attenuation scale/decay factors.\n\t\tsample *= illuminationDecay * weight;\n\n\t\tcolor += sample;\n\n\t\t// Update exponential decay factor.\n\t\tilluminationDecay *= decay;\n\n\t}\n\n\tgl_FragColor = clamp(color * exposure, 0.0, clampMax);\n\n}\n";
const vertex = "varying vec2 vUv;\n\nvoid main() {\n\n\tvUv = uv;\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n}\n";

/**
 * A crepuscular rays shader material.
 *
 * References:
 *
 * Thibaut Despoulain, 2012:
 *  (WebGL) Volumetric Light Approximation in Three.js
 *  http://bkcore.com/blog/3d/webgl-three-js-volumetric-light-godrays.html
 *
 * Nvidia, GPU Gems 3, 2008:
 *  Chapter 13. Volumetric Light Scattering as a Post-Process
 *  http://http.developer.nvidia.com/GPUGems3/gpugems3_ch13.html
 *
 * @class GodRaysMaterial
 * @submodule materials
 * @extends ShaderMaterial
 * @constructor
 */

export class GodRaysMaterial extends THREE.ShaderMaterial {

	constructor() {

		super({

			type: "GodRaysMaterial",

			defines: {

				NUM_SAMPLES_FLOAT: "60.0",
				NUM_SAMPLES_INT: "60"

			},

			uniforms: {

				tDiffuse: {value: null},
				lightPosition: {value: null},

				exposure: {value: 0.6},
				decay: {value: 0.93},
				density: {value: 0.96},
				weight: {value: 0.4},
				clampMax: {value: 1.0}

			},

			fragmentShader: fragment,
			vertexShader: vertex

		});

	}

}
