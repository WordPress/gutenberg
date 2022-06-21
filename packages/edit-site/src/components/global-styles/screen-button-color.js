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

function ScreenButtonColor( { name } ) {
	const canCustomize = useCanCustomizeColor(
		name,
		'color.background',
		'buttonColor'
	);

	if ( ! canCustomize ) {
		return null;
	}

	return (
		<>
			<ScreenHeader
				title={ __( 'Buttons' ) }
				description={ __(
					'Manage the fonts and typography used on buttons.'
				) }
			/>
			<h4 className="edit-site-global-styles-section-title">
				{ __( 'Text color' ) }
			</h4>
			<ScreenElementColorpicker
				name={ name }
				element="button"
				path="elements.button.background.text"
			/>
			<h4 className="edit-site-global-styles-section-title">
				{ __( 'Background color' ) }
			</h4>
			<ScreenElementColorpicker
				name={ name }
				element="button"
				path="elements.button.background.text"
			/>
		</>
	);
}

export default ScreenButtonColor;
