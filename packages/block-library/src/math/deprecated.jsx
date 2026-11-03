import { useBlockProps } from '@wordpress/block-editor';

// Earlier versions stored the LaTeX source in the block comment. Content that
// could not be rendered was saved with an empty `<math>`, so the source is
// only available from the comment attribute for such blocks.
const legacyAttributes = {
	latex: {
		type: 'string',
		role: 'content',
	},
	mathML: {
		type: 'string',
		source: 'html',
		selector: 'math',
	},
};

// v2: The LaTeX source was stored in the block comment.
const v2 = {
	attributes: legacyAttributes,
	save( { attributes } ) {
		const { latex, mathML } = attributes;

		if ( ! latex ) {
			return null;
		}

		return (
			<div { ...useBlockProps.save() }>
				<math
					display="block"
					dangerouslySetInnerHTML={ { __html: mathML } }
				/>
			</div>
		);
	},
};

// v1: Add a wrapper div around the math element.
const v1 = {
	attributes: legacyAttributes,
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
export default [ v2, v1 ];
