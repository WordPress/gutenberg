/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalPanelColorGradientSettings as PanelColorGradientSettings } from '@wordpress/block-editor';

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

function ScreenTextColor( { name } ) {
	const parentMenu = name === undefined ? '' : '/blocks/' + name;
	const supports = getSupportedGlobalStylesPanels( name );
	const [ solids ] = useSetting( 'color.palette', name );
	const [ areCustomSolidsEnabled ] = useSetting( 'color.custom', name );
	const [ isTextEnabled ] = useSetting( 'color.text', name );

	const colorsPerOrigin = useColorsPerOrigin( name );

	const hasTextColor =
		supports.includes( 'color' ) &&
		isTextEnabled &&
		( solids.length > 0 || areCustomSolidsEnabled );

	const [ color, setColor ] = useStyle( 'color.text', name );
	const [ userColor ] = useStyle( 'color.text', name, 'user' );

	if ( ! hasTextColor ) {
		return null;
	}

	const settings = [
		{
			colorValue: color,
			onColorChange: setColor,
			label: __( 'Text color' ),
			clearable: color === userColor,
		},
	];

	return (
		<>
			<ScreenHeader
				back={ parentMenu + '/colors' }
				title={ __( 'Text' ) }
				description={ __(
					'Set the default color used for text across the site.'
				) }
			/>

			<PanelColorGradientSettings
				title={ __( 'Color' ) }
				settings={ settings }
				colors={ colorsPerOrigin }
				disableCustomColors={ ! areCustomSolidsEnabled }
				__experimentalHasMultipleOrigins
				showTitle={ false }
			/>
		</>
	);
}

export default ScreenTextColor;
