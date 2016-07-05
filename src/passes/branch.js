import {
	Pass
} from "./pass";

export class BranchPass extends Pass {
	constructor(branch) {
		super();
		this.branch = branch;
	}

	render(renderer, readBuffer, writeBuffer, delta, maskActive) {
		this.branch.originalReadBuffer = readBuffer;
		this.branch.writeBuffer = writeBuffer.clone();
		this.branch.readBuffer = readBuffer.clone();
		return this.branch;
	}
}
