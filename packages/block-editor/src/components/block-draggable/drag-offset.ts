/**
 * The pointer's offset from a directly dragged block's visual, in pixels in
 * its owner document. Clear this transient geometry when the drag ends.
 * DataTransfer cannot supply it during dragover, when its data is protected.
 */
export const blockDragOffsets = new WeakMap<
	Element,
	{ left: number; right: number; top: number }
>();
