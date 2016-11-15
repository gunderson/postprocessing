const THREE = require('three');

import areaImage from "./area-image";
import searchImage from "./search-image";

const fragment = "#define sampleLevelZeroOffset(t, coord, offset) texture2D(t, coord + float(offset) * texelSize, 0.0)\n\nuniform sampler2D tDiffuse;\nuniform sampler2D tArea;\nuniform sampler2D tSearch;\n\nuniform vec2 texelSize;\n\nvarying vec2 vUv;\nvarying vec4 vOffset[3];\nvarying vec2 vPixCoord;\n\nvec2 round(vec2 x) {\n\n\treturn sign(x) * floor(abs(x) + 0.5);\n\n}\n\nfloat searchLength(vec2 e, float bias, float scale) {\n\n\t// Not required if tSearch accesses are set to point.\n\t// const vec2 SEARCH_TEX_PIXEL_SIZE = 1.0 / vec2(66.0, 33.0);\n\t// e = vec2(bias, 0.0) + 0.5 * SEARCH_TEX_PIXEL_SIZE + e * vec2(scale, 1.0) * vec2(64.0, 32.0) * SEARCH_TEX_PIXEL_SIZE;\n\n\te.r = bias + e.r * scale;\n\n\treturn 255.0 * texture2D(tSearch, e, 0.0).r;\n\n}\n\nfloat searchXLeft(vec2 texCoord, float end) {\n\n\t/* @PSEUDO_GATHER4\n\t * This texCoord has been offset by (-0.25, -0.125) in the vertex shader to\n\t * sample between edge, thus fetching four edges in a row.\n\t * Sampling with different offsets in each direction allows to disambiguate\n\t * which edges are active from the four fetched ones.\n\t */\n\n\tvec2 e = vec2(0.0, 1.0);\n\n\tfor(int i = 0; i < SMAA_MAX_SEARCH_STEPS_INT; ++i) {\n\n\t\te = texture2D(tDiffuse, texCoord, 0.0).rg;\n\t\ttexCoord -= vec2(2.0, 0.0) * texelSize;\n\n\t\tif(!(texCoord.x > end && e.g > 0.8281 && e.r == 0.0)) { break; }\n\n\t}\n\n\t// Correct the previously applied offset (-0.25, -0.125).\n\ttexCoord.x += 0.25 * texelSize.x;\n\n\t// The searches are biased by 1, so adjust the coords accordingly.\n\ttexCoord.x += texelSize.x;\n\n\t// Disambiguate the length added by the last step.\n\ttexCoord.x += 2.0 * texelSize.x; // Undo last step.\n\ttexCoord.x -= texelSize.x * searchLength(e, 0.0, 0.5);\n\n\treturn texCoord.x;\n\n}\n\nfloat searchXRight(vec2 texCoord, float end) {\n\n\tvec2 e = vec2(0.0, 1.0);\n\n\tfor(int i = 0; i < SMAA_MAX_SEARCH_STEPS_INT; ++i) {\n\n\t\te = texture2D(tDiffuse, texCoord, 0.0).rg;\n\t\ttexCoord += vec2(2.0, 0.0) * texelSize;\n\n\t\tif(!(texCoord.x < end && e.g > 0.8281 && e.r == 0.0)) { break; }\n\n\t}\n\n\ttexCoord.x -= 0.25 * texelSize.x;\n\ttexCoord.x -= texelSize.x;\n\ttexCoord.x -= 2.0 * texelSize.x;\n\ttexCoord.x += texelSize.x * searchLength(e, 0.5, 0.5);\n\n\treturn texCoord.x;\n\n}\n\nfloat searchYUp(vec2 texCoord, float end) {\n\n\tvec2 e = vec2(1.0, 0.0);\n\n\tfor(int i = 0; i < SMAA_MAX_SEARCH_STEPS_INT; ++i) {\n\n\t\te = texture2D(tDiffuse, texCoord, 0.0).rg;\n\t\ttexCoord += vec2(0.0, 2.0) * texelSize; // Changed sign.\n\n\t\tif(!(texCoord.y > end && e.r > 0.8281 && e.g == 0.0)) { break; }\n\n\t}\n\n\ttexCoord.y -= 0.25 * texelSize.y; // Changed sign.\n\ttexCoord.y -= texelSize.y; // Changed sign.\n\ttexCoord.y -= 2.0 * texelSize.y; // Changed sign.\n\ttexCoord.y += texelSize.y * searchLength(e.gr, 0.0, 0.5); // Changed sign.\n\n\treturn texCoord.y;\n\n}\n\nfloat searchYDown(vec2 texCoord, float end) {\n\n\tvec2 e = vec2(1.0, 0.0);\n\n\tfor(int i = 0; i < SMAA_MAX_SEARCH_STEPS_INT; ++i ) {\n\n\t\te = texture2D(tDiffuse, texCoord, 0.0).rg;\n\t\ttexCoord -= vec2(0.0, 2.0) * texelSize; // Changed sign.\n\n\t\tif(!(texCoord.y < end && e.r > 0.8281 && e.g == 0.0)) { break; }\n\n\t}\n\n\ttexCoord.y += 0.25 * texelSize.y; // Changed sign.\n\ttexCoord.y += texelSize.y; // Changed sign.\n\ttexCoord.y += 2.0 * texelSize.y; // Changed sign.\n\ttexCoord.y -= texelSize.y * searchLength(e.gr, 0.5, 0.5); // Changed sign.\n\n\treturn texCoord.y;\n\n}\n\nvec2 area(vec2 dist, float e1, float e2, float offset) {\n\n\t// Rounding prevents precision errors of bilinear filtering.\n\tvec2 texCoord = SMAA_AREATEX_MAX_DISTANCE * round(4.0 * vec2(e1, e2)) + dist;\n\n\t// Scale and bias for texel space translation.\n\ttexCoord = SMAA_AREATEX_PIXEL_SIZE * texCoord + (0.5 * SMAA_AREATEX_PIXEL_SIZE);\n\n\t// Move to proper place, according to the subpixel offset.\n\ttexCoord.y += SMAA_AREATEX_SUBTEX_SIZE * offset;\n\n\treturn texture2D(tArea, texCoord, 0.0).rg;\n\n}\n\nvoid main() {\n\n\tvec4 weights = vec4(0.0);\n\tvec4 subsampleIndices = vec4(0.0);\n\tvec2 e = texture2D(tDiffuse, vUv).rg;\n\n\tif(e.g > 0.0) {\n\n\t\t// Edge at north.\n\t\tvec2 d;\n\n\t\t// Find the distance to the left.\n\t\tvec2 coords;\n\t\tcoords.x = searchXLeft(vOffset[0].xy, vOffset[2].x);\n\t\tcoords.y = vOffset[1].y; // vOffset[1].y = vUv.y - 0.25 * texelSize.y (@CROSSING_OFFSET)\n\t\td.x = coords.x;\n\n\t\t/* Now fetch the left crossing edges, two at a time using bilinear filtering.\n\t\t * Sampling at -0.25 (see @CROSSING_OFFSET) enables to discern what value each edge has.\n\t\t */\n\n\t\tfloat e1 = texture2D(tDiffuse, coords, 0.0).r;\n\n\t\t// Find the distance to the right.\n\t\tcoords.x = searchXRight(vOffset[0].zw, vOffset[2].y);\n\t\td.y = coords.x;\n\n\t\t// Translate distances to pixel units for better interleave arithmetic and memory accesses.\n\t\td = d / texelSize.x - vPixCoord.x;\n\n\t\t// The area below needs a sqrt, as the areas texture is compressed quadratically.\n\t\tvec2 sqrtD = sqrt(abs(d));\n\n\t\t// Fetch the right crossing edges.\n\t\tcoords.y -= texelSize.y; // WebGL port note: Added.\n\t\tfloat e2 = sampleLevelZeroOffset(tDiffuse, coords, ivec2(1, 0)).r;\n\n\t\t// Pattern recognised, now get the actual area.\n\t\tweights.rg = area(sqrtD, e1, e2, subsampleIndices.y);\n\n\t}\n\n\tif(e.r > 0.0) {\n\n\t\t// Edge at west.\n\t\tvec2 d;\n\n\t\t// Find the distance to the top.\n\t\tvec2 coords;\n\n\t\tcoords.y = searchYUp(vOffset[1].xy, vOffset[2].z);\n\t\tcoords.x = vOffset[0].x; // vOffset[1].x = vUv.x - 0.25 * texelSize.x;\n\t\td.x = coords.y;\n\n\t\t// Fetch the top crossing edges.\n\t\tfloat e1 = texture2D(tDiffuse, coords, 0.0).g;\n\n\t\t// Find the distance to the bottom.\n\t\tcoords.y = searchYDown(vOffset[1].zw, vOffset[2].w);\n\t\td.y = coords.y;\n\n\t\t// Distances in pixel units.\n\t\td = d / texelSize.y - vPixCoord.y;\n\n\t\t// The area below needs a sqrt, as the areas texture is compressed quadratically.\n\t\tvec2 sqrtD = sqrt(abs(d));\n\n\t\t// Fetch the bottom crossing edges.\n\t\tcoords.y -= texelSize.y; // WebGL port note: Added.\n\t\tfloat e2 = sampleLevelZeroOffset(tDiffuse, coords, ivec2(0, 1)).g;\n\n\t\t// Get the area for this direction.\n\t\tweights.ba = area(sqrtD, e1, e2, subsampleIndices.x);\n\n\t}\n\n\tgl_FragColor = weights;\n\n}\n";
const vertex = "uniform vec2 texelSize;\n\nvarying vec2 vUv;\nvarying vec4 vOffset[3];\nvarying vec2 vPixCoord;\n\nvoid main() {\n\n\tvUv = uv;\n\n\tvPixCoord = uv / texelSize;\n\n\t// Offsets for the searches (see @PSEUDO_GATHER4).\n\tvOffset[0] = uv.xyxy + texelSize.xyxy * vec4(-0.25, 0.125, 1.25, 0.125); // Changed sign in Y and W components.\n\tvOffset[1] = uv.xyxy + texelSize.xyxy * vec4(-0.125, 0.25, -0.125, -1.25); //Changed sign in Y and W components.\n\n\t// This indicates the ends of the loops.\n\tvOffset[2] = vec4(vOffset[0].xz, vOffset[1].yw) + vec4(-2.0, 2.0, -2.0, 2.0) * texelSize.xxyy * SMAA_MAX_SEARCH_STEPS_FLOAT;\n\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n}\n";

/**
 * Subpixel Morphological Antialiasing.
 *
 * This material computes weights for detected edges.
 *
 * @class SMAAWeightsMaterial
 * @submodule materials
 * @extends ShaderMaterial
 * @constructor
 * @param {Vector2} [texelSize] - The absolute screen texel size.
 */

export class SMAAWeightsMaterial extends THREE.ShaderMaterial {

	constructor(texelSize) {

		super({

			type: "SMAAWeightsMaterial",

			defines: {

				SMAA_MAX_SEARCH_STEPS_INT: "8",
				SMAA_MAX_SEARCH_STEPS_FLOAT: "8.0",

				SMAA_AREATEX_MAX_DISTANCE: "16.0",

				SMAA_AREATEX_PIXEL_SIZE: "(1.0 / vec2(160.0, 560.0))",
				SMAA_AREATEX_SUBTEX_SIZE: "(1.0 / 7.0)"

			},

			uniforms: {

				tDiffuse: {value: null},
				tArea: {value: null},
				tSearch: {value: null},
				texelSize: {value: (texelSize !== undefined) ? texelSize : new THREE.Vector2()}

			},

			fragmentShader: fragment,
			vertexShader: vertex

		});

		/**
		 * The area pattern recognition image.
		 *
		 * @property areaImage
		 * @type String
		 */

		this.areaImage = areaImage;

		/**
		 * The search image.
		 *
		 * @property searchImage
		 * @type String
		 */

		this.searchImage = searchImage;

	}

}
