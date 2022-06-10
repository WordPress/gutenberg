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

	const [ isLinkEnabled ] = useSetting( 'color.link', name );

	const hasButtonColor =
		supports.includes( 'linkColor' ) &&
		isLinkEnabled &&
		( solids.length > 0 || areCustomSolidsEnabled ); // TODO - use the right check

	const [ buttonColor, setButtonColor ] = useStyle(
		'elements.button.color.text',
		name
	);
	const [ userButtonColor ] = useStyle(
		'elements.button.color.text',
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
					'Set the default color used for buttons across the site.'
				) }
			/>
			<ColorGradientControl
				className="edit-site-screen-button-color__control"
				colors={ colorsPerOrigin }
				disableCustomColors={ ! areCustomSolidsEnabled }
				__experimentalHasMultipleOrigins
				showTitle={ false }
				enableAlpha
				__experimentalIsRenderedInSidebar
				colorValue={ buttonColor }
				onColorChange={ setButtonColor }
				clearable={ buttonColor === userButtonColor }
			/>
		</>
	);
}

export default ScreenButtonColor;
