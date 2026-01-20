/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

// Template with core/buttons containing prev/next buttons
const BUTTONS_TEMPLATE = [
	[
		'core/buttons',
		{},
		[
			[
				'core/button',
				{
					text: '←',
					className: 'wp-block-slider-controls__previous',
				},
			],
			[
				'core/button',
				{
					text: '→',
					className: 'wp-block-slider-controls__next',
				},
			],
		],
	],
];

function SliderControlsEdit( { clientId } ) {
	const blockProps = useBlockProps( {
		className: clsx( 'wp-block-slider-controls' ),
	} );

	const hasInnerBlocks = useSelect(
		( select ) => {
			const { getBlock } = select( blockEditorStore );
			const block = getBlock( clientId );
			return !! ( block && block.innerBlocks.length );
		},
		[ clientId ]
	);

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: BUTTONS_TEMPLATE,
		templateLock: hasInnerBlocks ? false : 'all',
		allowedBlocks: [ 'core/buttons', 'core/button' ],
	} );

	return <div { ...innerBlocksProps } />;
}

export default SliderControlsEdit;
