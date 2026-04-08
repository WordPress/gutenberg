/**
 * WordPress dependencies
 */
import {
	createBlock,
	getBlockType,
	getDefaultBlockName,
} from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'input',
			regExp: /^-{3,}$/,
			transform: () => {
				// Check for default variation to preserve attributes.
				const blockType = getBlockType( 'core/separator' );
				const defaultVariation = blockType?.variations?.find(
					( variation ) => variation.isDefault
				);

				// Fall back to empty attributes if no default variation is found.
				const attributes = defaultVariation
					? defaultVariation.attributes
					: {};

				return [
					createBlock( 'core/separator', attributes ),
					createBlock( getDefaultBlockName() ),
				];
			},
		},
		{
			type: 'raw',
			selector: 'hr',
			schema: {
				hr: {},
			},
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/spacer' ], // Transform to Spacer.
			transform: ( { anchor } ) => {
				return createBlock( 'core/spacer', {
					anchor: anchor || undefined,
				} );
			},
		},
	],
};

export default transforms;
