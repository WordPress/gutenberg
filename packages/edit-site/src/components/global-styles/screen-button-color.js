/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalColorGradientControl as ColorGradientControl } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import {
	getSupportedGlobalStylesPanels,
	useSetting,
	useStyle,
	useColorsPerOrigin,
} from './hooks';

function ScreenButtonColor( { name } ) {
	const supports = getSupportedGlobalStylesPanels( name );
	const [ solids ] = useSetting( 'color.palette', name );
	const [ areCustomSolidsEnabled ] = useSetting( 'color.custom', name );

	const colorsPerOrigin = useColorsPerOrigin( name );

	const hasButtonColor =
		supports.includes( 'buttonColor' ) &&
		( solids.length > 0 || areCustomSolidsEnabled ); // TODO - use the right check

	const [ buttonTextColor, setButtonTextColor ] = useStyle(
		'elements.button.color.text',
		name
	);
	const [ userButtonTextColor ] = useStyle(
		'elements.button.color.text',
		name,
		'user'
	);

	const [ buttonBgColor, setButtonBgColor ] = useStyle(
		'elements.button.backgound.color',
		name
	);
	const [ userButtonBgColor ] = useStyle(
		'elements.button.backgound.color',
		name,
		'user'
	);

	if ( ! hasButtonColor ) {
		return null;
	}

	return (
		<>
			<ScreenHeader
				title={ __( 'Buttons' ) }
				description={ __(
					'Set the default colors used for buttons across the site.'
				) }
			/>

			<h2>{ __( 'Set text color' ) }</h2>
			<ColorGradientControl
				className="edit-site-screen-button-color__control"
				colors={ colorsPerOrigin }
				disableCustomColors={ ! areCustomSolidsEnabled }
				__experimentalHasMultipleOrigins
				showTitle={ false }
				enableAlpha
				__experimentalIsRenderedInSidebar
				colorValue={ buttonTextColor }
				onColorChange={ setButtonTextColor }
				clearable={ buttonTextColor === userButtonTextColor }
			/>

			<h2>{ __( 'Set background color' ) }</h2>
			<ColorGradientControl
				className="edit-site-screen-button-color__control"
				colors={ colorsPerOrigin }
				disableCustomColors={ ! areCustomSolidsEnabled }
				__experimentalHasMultipleOrigins
				showTitle={ false }
				enableAlpha
				__experimentalIsRenderedInSidebar
				colorValue={ buttonBgColor }
				onColorChange={ setButtonBgColor }
				clearable={ buttonBgColor === userButtonBgColor }
			/>
		</>
	);
}

export default ScreenButtonColor;
