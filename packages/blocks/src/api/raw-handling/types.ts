export interface RawTransform {
	type: string;
	blockName: string;
	selector?: string;
	schema?:
		| Record< string, unknown >
		| ( ( args: Record< string, unknown > ) => Record< string, unknown > );
	isMatch: ( node: Element ) => boolean;
	transform?: ( node: Node, handler: Function ) => unknown;
}

export type NodeFilterFunction = (
	node: Node,
	doc: Document,
	schema?: Record< string, unknown >
) => void;
