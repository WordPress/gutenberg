type MetaData = {
	bindings?: Record< string, string >;
};
type UpdateBlockAttributes = (
	id: string,
	attributes: Record< string, any >
) => void;

export const addConnection = (
	value: string,
	attribute: string,
	metadata: MetaData,
	_id: string,
	updateBlockAttributes: UpdateBlockAttributes
) => {
	// Assuming the block expects a flat structure for its metadata attribute
	const newMetadata = {
		...metadata,
		// Adjust this according to the actual structure expected by your block
		bindings: {
			...metadata?.bindings,
			[ attribute ]: {
				source: 'core/post-meta',
				args: { key: value },
			},
		},
	};

	// Update the block's attributes with the new metadata
	updateBlockAttributes( _id, {
		metadata: newMetadata,
	} );
};

export const removeConnection = (
	key: string,
	metadata: MetaData,
	_id: string,
	updateBlockAttributes: (
		id: string,
		attributes: Record< string, any >
	) => void
) => {
	const newMetadata = { ...metadata };
	if ( ! newMetadata.bindings ) {
		return;
	}
	delete newMetadata.bindings[ key ];
	if ( Object.keys( newMetadata.bindings ).length === 0 ) {
		delete newMetadata.bindings;
	}
	updateBlockAttributes( _id, {
		metadata:
			Object.keys( newMetadata ).length === 0 ? undefined : newMetadata,
	} );
};
