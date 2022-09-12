/**
 * WordPress dependencies
 */
import { useBlockProps, getSpacingPresetCssVar } from '@wordpress/block-editor';
import { Platform } from '@wordpress/element';

export default function save( { attributes: { height, width } } ) {
	const currentHeight = Platform.isWeb
		? getSpacingPresetCssVar( height )
		: height;
	const currentWidth = Platform.isWeb
		? getSpacingPresetCssVar( width )
		: width;
	return (
		<div
			{ ...useBlockProps.save( {
				style: {
					height: currentHeight,
					width: currentWidth,
				},
				'aria-hidden': true,
			} ) }
		/>
	);
}
