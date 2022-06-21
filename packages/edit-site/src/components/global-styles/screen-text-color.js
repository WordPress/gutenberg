/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import { useCanCustomizeColor } from './hooks';
import ScreenElementColorpicker from './screen-element-colorpicker';

function ScreenTextColor( { name } ) {
	const canCustomize = useCanCustomizeColor( name, 'color.text', 'color' );

	if ( ! canCustomize ) {
		return null;
	}

	return (
		<>
			<ScreenHeader
				title={ __( 'Text' ) }
				description={ __(
					'Set the default color used for text across the site.'
				) }
			/>
			<ScreenElementColorpicker
				name={ name }
				element="button"
				path="elements.link.color.text"
			/>
		</>
	);
}

export default ScreenTextColor;
