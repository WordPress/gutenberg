/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

// v1: Add a wrapper div around the math element.
const v1 = {
	attributes: {
		latex: {
			type: 'string',
			role: 'content',
		},
		mathML: {
			type: 'string',
			source: 'html',
			selector: 'math',
		},
	},
	save( { attributes } ) {
		const { latex, mathML } = attributes;

		if ( ! latex ) {
			return null;
		}

		return (
			<math
				{ ...useBlockProps.save() }
				display="block"
				dangerouslySetInnerHTML={ { __html: mathML } }
			/>
		);
	},
};

/**
 * New deprecations need to be placed first
 * for them to have higher priority.
 *
 * Old deprecations may need to be updated as well.
 *
 * See block-deprecation.md
 */
export default [ v1 ];
