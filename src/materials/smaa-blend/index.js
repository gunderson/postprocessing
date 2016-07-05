import THREE from "three";

const fragment = "uniform sampler2D tDiffuse;\nuniform sampler2D tWeights;\n\nuniform vec2 texelSize;\n\nvarying vec2 vUv;\nvarying vec4 vOffset;\n\nvoid main() {\n\n\t// Fetch the blending weights for current pixel.\n\tvec4 a;\n\ta.xz = texture2D(tWeights, vUv).xz;\n\ta.y = texture2D(tWeights, vOffset.zw).g;\n\ta.w = texture2D(tWeights, vOffset.xy).a;\n\n\tvec4 color;\n\n\t// Check if there is any blending weight with a value greater than 0.0.\n\tif(dot(a, vec4(1.0)) < 1e-5) {\n\n\t\tcolor = texture2D(tDiffuse, vUv, 0.0);\n\n\t} else {\n\n\t\t/* Up to four lines can be crossing a pixel (one through each edge). We favor\n\t\t * blending by choosing the line with the maximum weight for each direction.\n\t\t */\n\n\t\tvec2 offset;\n\t\toffset.x = a.a > a.b ? a.a : -a.b; // Left vs. right.\n\t\toffset.y = a.g > a.r ? -a.g : a.r; // Top vs. bottom (changed signs).\n\n\t\t// Then we go in the direction that has the maximum weight (horizontal vs. vertical).\n\t\tif(abs(offset.x) > abs(offset.y)) {\n\n\t\t\toffset.y = 0.0;\n\n\t\t} else {\n\n\t\t\toffset.x = 0.0;\n\n\t\t}\n\n\t\t// Fetch the opposite color and lerp by hand.\n\t\tcolor = texture2D(tDiffuse, vUv, 0.0);\n\t\tvec2 coord = vUv + sign(offset) * texelSize;\n\t\tvec4 oppositeColor = texture2D(tDiffuse, coord, 0.0);\n\t\tfloat s = abs(offset.x) > abs(offset.y) ? abs(offset.x) : abs(offset.y);\n\n\t\t// Gamma correction.\n\t\tcolor.rgb = pow(abs(color.rgb), vec3(2.2));\n\t\toppositeColor.rgb = pow(abs(oppositeColor.rgb), vec3(2.2));\n\t\tcolor = mix(color, oppositeColor, s);\n\t\tcolor.rgb = pow(abs(color.rgb), vec3(1.0 / 2.2));\n\n\t}\n\n\tgl_FragColor = color;\n\n}\n";
const vertex = "uniform vec2 texelSize;\n\nvarying vec2 vUv;\nvarying vec4 vOffset;\n\nvoid main() {\n\n\tvUv = uv;\n\n\tvOffset = uv.xyxy + texelSize.xyxy * vec4(1.0, 0.0, 0.0, -1.0); // Changed sign in W component.\n\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n}\n";

/**
 * Subpixel Morphological Antialiasing.
 *
 * This material is used to render the final antialiasing.
 *
 * @class SMAABlendMaterial
 * @submodule materials
 * @extends ShaderMaterial
 * @constructor
 * @param {Vector2} [texelSize] - The absolute screen texel size.
 */

export class SMAABlendMaterial extends THREE.ShaderMaterial {

	constructor(texelSize) {

		super({

			type: "SMAABlendMaterial",

			uniforms: {

				tDiffuse: {value: null},
				tWeights: {value: null},
				texelSize: {value: (texelSize !== undefined) ? texelSize : new THREE.Vector2()}

			},

			fragmentShader: fragment,
			vertexShader: vertex

		});

	}

}
