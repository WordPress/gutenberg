export interface Flusher {
	flush: () => void;
	dispose: () => void;
}
export interface ParentElement extends Element {
	__k: {
		nodeType: 1;
		parentNode: ParentElement;
		firstChild: Node;
		childNodes: Node[];
		insertBefore: Function;
		appendChild: Function;
		removeChild: Function;
	};
}
