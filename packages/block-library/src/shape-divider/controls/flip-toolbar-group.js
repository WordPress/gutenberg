/**
 * WordPress dependencies
 */
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { flipHorizontal, flipVertical } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

const FlipToolbarGroup = ( { attributes, setAttributes } ) => {
	const {
		flipHorizontal: flipHorizontalValue,
		flipVertical: flipVerticalValue,
	} = attributes;

	return (
		<ToolbarGroup>
			<ToolbarButton
				title={ __( 'Flip horizontal' ) }
				icon={ flipHorizontal }
				isPressed={ flipHorizontalValue }
				onClick={ () => setAttributes( {
					flipHorizontal: ! flipHorizontalValue,
				} ) }
			/>
			<ToolbarButton
				title={ __( 'Flip vertical' ) }
				icon={ flipVertical }
				isPressed={ flipVerticalValue }
				onClick={ () => setAttributes( {
					flipVertical: ! flipVerticalValue,
				} ) }
			/>
		</ToolbarGroup>
	);
};

export default FlipToolbarGroup;
