const isObject = ( obj ) =>
	typeof obj === 'object' && ! Array.isArray( obj ) && obj !== null;

// v2: Migrate to a more condensed version of the 'content' attribute attribute.
const v2 = {
	attributes: {
		ref: {
			type: 'number',
		},
		content: {
			type: 'object',
		},
	},
	supports: {
		customClassName: false,
		html: false,
		inserter: false,
		renaming: false,
	},
	// Force this deprecation to run whenever there's a values sub-property that's an object.
	//
	// This could fail in the future if a block ever has binding to a `values` attribute.
	// Some extra protection is added to ensure `values` is an object, but this only reduces
	// the likelihood, it doesn't solve it completely.
	isEligible( { content } ) {
		return (
			!! content &&
			Object.keys( content ).every(
				( contentKey ) =>
					content[ contentKey ].values &&
					isObject( content[ contentKey ].values )
			)
		);
	},
	/*
	 * Old attribute format:
	 * content: {
	 *     "V98q_x": {
	 * 	   		// The attribute values are now stored as a 'values' sub-property.
	 *         values: { content: 'My content value' },
	 * 	       // ... additional metadata, like the block name can be stored here.
	 *     }
	 * }
	 *
	 * New attribute format:
	 * content: {
	 *     "V98q_x": {
	 *         content: 'My content value',
	 *     }
	 * }
	 */
	migrate( attributes ) {
		const { content, ...retainedAttributes } = attributes;

		if ( content && Object.keys( content ).length ) {
			const updatedContent = { ...content };

			for ( const contentKey in content ) {
				updatedContent[ contentKey ] = content[ contentKey ].values;
			}

			return {
				...retainedAttributes,
				content: updatedContent,
			};
		}

		return attributes;
	},
};

// v1: Rename the `overrides` attribute to the `content` attribute.
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
	 *     "V98q_x": { content: 'My content value' }
	 * }
	 *
	 * New attribute format:
	 * content: {
	 *     "V98q_x": { content: 'My content value' }
	 * }
	 *
	 */
	migrate( attributes ) {
		const { overrides, ...retainedAttributes } = attributes;

		const content = {};

		Object.keys( overrides ).forEach( ( id ) => {
			content[ id ] = overrides[ id ];
		} );

		return {
			...retainedAttributes,
			content,
		};
	},
};

export default [ v2, v1 ];
