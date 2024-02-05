// v1: Migrate and rename the `overrides` attribute to the `content` attribute.
const v1 = {
	attributes: {
		ref: {
			type: 'number',
		},
		overrides: {
			type: 'object',
		},
	},
	supports: {
		customClassName: false,
		html: false,
		inserter: false,
		renaming: false,
	},
	// Force this deprecation to run whenever there's an `overrides` object.
	isEligible( { overrides } ) {
		return !! overrides;
	},
	/*
	 * Old attribute format:
	 * overrides: {
	 *     // An key is an id that represents a block.
	 *     // The values are the attribute values of the block.
	 *     "V98q_x": { content: 'dwefwefwefwe' }
	 * }
	 *
	 * New attribute format:
	 * content: {
	 *     "V98q_x": {
	 * 	   		// The attribute values are now stored as a 'values' sub-property.
	 *         values: { content: 'dwefwefwefwe' },
	 * 	       // ... additional metadata, like the block name can be stored here.
	 *     }
	 * }
	 *
	 */
	migrate( attributes ) {
		const { overrides, ...retainedAttributes } = attributes;

		const content = {};

		Object.keys( overrides ).forEach( ( id ) => {
			content[ id ] = {
				values: overrides[ id ],
			};
		} );

		return {
			...retainedAttributes,
			content,
		};
	},
};

export default [ v1 ];
