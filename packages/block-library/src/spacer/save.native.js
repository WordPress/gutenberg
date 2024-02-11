/**
 * WordPress dependencies
 */
import { useBlockProps, getSpacingPresetCssVar } from '@wordpress/block-editor';

export default function save( { attributes: { height, width } } ) {
	return (
		<div
			{ ...useBlockProps.save( {
				style: {
					height: getSpacingPresetCssVar( height ),
					width: getSpacingPresetCssVar( width ),
				},
				'aria-hidden': true,
			} ) }
		/>
	);
}
