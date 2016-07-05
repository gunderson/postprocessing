import THREE from "three";

const fragment = "uniform sampler2D tDiffuse;\n\nvarying vec2 vUv;\nvarying vec4 vOffset[3];\n\nvoid main() {\n\n\tconst vec2 THRESHOLD = vec2(EDGE_THRESHOLD);\n\n\t// Calculate color deltas.\n\tvec4 delta;\n\tvec3 c = texture2D(tDiffuse, vUv).rgb;\n\n\tvec3 cLeft = texture2D(tDiffuse, vOffset[0].xy).rgb;\n\tvec3 t = abs(c - cLeft);\n\tdelta.x = max(max(t.r, t.g), t.b);\n\n\tvec3 cTop = texture2D(tDiffuse, vOffset[0].zw).rgb;\n\tt = abs(c - cTop);\n\tdelta.y = max(max(t.r, t.g), t.b);\n\n\t// We do the usual threshold.\n\tvec2 edges = step(THRESHOLD, delta.xy);\n\n\t// Then discard if there is no edge.\n\tif(dot(edges, vec2(1.0)) == 0.0) {\n\n\t\tdiscard;\n\n\t}\n\n\t// Calculate right and bottom deltas.\n\tvec3 cRight = texture2D(tDiffuse, vOffset[1].xy).rgb;\n\tt = abs(c - cRight);\n\tdelta.z = max(max(t.r, t.g), t.b);\n\n\tvec3 cBottom  = texture2D(tDiffuse, vOffset[1].zw).rgb;\n\tt = abs(c - cBottom);\n\tdelta.w = max(max(t.r, t.g), t.b);\n\n\t// Calculate the maximum delta in the direct neighborhood.\n\tfloat maxDelta = max(max(max(delta.x, delta.y), delta.z), delta.w);\n\n\t// Calculate left-left and top-top deltas.\n\tvec3 cLeftLeft  = texture2D(tDiffuse, vOffset[2].xy).rgb;\n\tt = abs(c - cLeftLeft);\n\tdelta.z = max(max(t.r, t.g), t.b);\n\n\tvec3 cTopTop = texture2D(tDiffuse, vOffset[2].zw).rgb;\n\tt = abs(c - cTopTop);\n\tdelta.w = max(max(t.r, t.g), t.b);\n\n\t// Calculate the final maximum delta.\n\tmaxDelta = max(max(maxDelta, delta.z), delta.w);\n\n\t// Local contrast adaptation in action.\n\tedges.xy *= step(0.5 * maxDelta, delta.xy);\n\n\tgl_FragColor = vec4(edges, 0.0, 0.0);\n\n}\n";
const vertex = "uniform vec2 texelSize;\n\nvarying vec2 vUv;\nvarying vec4 vOffset[3];\n\nvoid main() {\n\n\tvUv = uv;\n\n\tvOffset[0] = uv.xyxy + texelSize.xyxy * vec4(-1.0, 0.0, 0.0, 1.0); // Changed sign in W component.\n\tvOffset[1] = uv.xyxy + texelSize.xyxy * vec4(1.0, 0.0, 0.0, -1.0); // Changed sign in W component.\n\tvOffset[2] = uv.xyxy + texelSize.xyxy * vec4(-2.0, 0.0, 0.0, 2.0); // Changed sign in W component.\n\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n}\n";

/**
 * Subpixel Morphological Antialiasing.
 *
 * This material detects edges in a color texture.
 *
 * @class SMAAColorEdgesMaterial
 * @submodule materials
 * @extends ShaderMaterial
 * @constructor
 * @param {Vector2} [texelSize] - The absolute screen texel size.
 */

export class SMAAColorEdgesMaterial extends THREE.ShaderMaterial {

	constructor(texelSize) {

		super({

			type: "SMAAColorEdgesMaterial",

			defines: {

				EDGE_THRESHOLD: "0.1"

			},

			uniforms: {

				tDiffuse: {value: null},
				texelSize: {value: (texelSize !== undefined) ? texelSize : new THREE.Vector2()}

			},

			fragmentShader: fragment,
			vertexShader: vertex

		});

	}

}
