declare module '@wordpress/blocks' {
	interface BlockType {
		name: string;
		attributes?: Record< string, { type?: string } >;
	}

	function getBlockTypes(): BlockType[];
}
