/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

const deprecated = [
	{
		supports: {
			align: [ 'center', 'left', 'right' ],
			anchor: true,
		},
		save() {
			return (
				<div>
					<InnerBlocks.Content />
				</div>
			);
		},
		isEligible( { align } ) {
			return align && [ 'center', 'left', 'right' ].includes( align );
		},
		migrate( attributes ) {
			return {
				...attributes,
				align: undefined,
				// Floating Buttons blocks shouldn't have been supported in the
				// first place. Most users using them probably expected them to
				// act like content justification controls, so these blocks are
				// migrated to use content justification.
				// As for center-aligned Buttons blocks, the content justification
				// equivalent will create an identical end result in most cases.
				contentJustification: attributes.align,
			};
		},
	},
];

export default deprecated;
