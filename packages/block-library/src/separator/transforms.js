/**
 * WordPress dependencies
 */
import {
	createBlock,
	getBlockVariations,
	getDefaultBlockName,
} from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'input',
			regExp: /^-{3,}$/,
			transform: () => {
				// Check for default variation to apply default variation attributes.
				const defaultVariation = getBlockVariations(
					'core/separator'
				)?.find( ( variation ) => variation.isDefault );

				return [
					createBlock(
						'core/separator',
						defaultVariation?.attributes ?? {}
					),
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
