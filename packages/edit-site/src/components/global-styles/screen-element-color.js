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

function ScreenElementColor( {
	name,
	title,
	description,
	settingPrefix,
	customizeText,
	customizeBackground,
	requiredSetting,
	requiredSupport,
} ) {
	const canCustomize = useCanCustomizeColor(
		name,
		requiredSetting,
		requiredSupport
	);

	if ( ! canCustomize ) {
		return null;
	}

	const sctrions = {
		text: {
			header: __( 'Text color' ),
			setting: `${ settingPrefix }.text`,
			enabled: customizeText,
		},
	};

	return (
		<>
			<ScreenHeader title={ title } description={ description } />

			<h4 className="edit-site-global-styles-section-title">
				{ __( 'Text color' ) }
			</h4>

			<ScreenElementColorpicker
				name={ name }
				element="button"
				path="elements.button.color.text"
			/>

			<h4 className="edit-site-global-styles-section-title">
				{ __( 'Background color' ) }
			</h4>

			<ScreenElementColorpicker
				name={ name }
				element="button"
				path="elements.button.color.background"
			/>
		</>
	);
}

export default ScreenElementColor;
