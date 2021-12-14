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
	useColorsPerOrigin,
	useGradientsPerOrigin,
	useSetting,
	useStyle,
} from './hooks';

function ScreenBackgroundColor( { name } ) {
	const parentMenu = name === undefined ? '' : '/blocks/' + name;
	const supports = getSupportedGlobalStylesPanels( name );
	const [ solids ] = useSetting( 'color.palette', name );
	const [ gradients ] = useSetting( 'color.gradients', name );
	const [ areCustomSolidsEnabled ] = useSetting( 'color.custom', name );
	const [ areCustomGradientsEnabled ] = useSetting(
		'color.customGradient',
		name
	);

	const colorsPerOrigin = useColorsPerOrigin( name );
	const gradientsPerOrigin = useGradientsPerOrigin( name );

	const [ isBackgroundEnabled ] = useSetting( 'color.background', name );

	const hasBackgroundColor =
		supports.includes( 'backgroundColor' ) &&
		isBackgroundEnabled &&
		( solids.length > 0 || areCustomSolidsEnabled );
	const hasGradientColor =
		supports.includes( 'background' ) &&
		( gradients.length > 0 || areCustomGradientsEnabled );
	const [ backgroundColor, setBackgroundColor ] = useStyle(
		'color.background',
		name
	);
	const [ userBackgroundColor ] = useStyle(
		'color.background',
		name,
		'user'
	);
	const [ gradient, setGradient ] = useStyle( 'color.gradient', name );
	const [ userGradient ] = useStyle( 'color.gradient', name, 'user' );

	if ( ! hasBackgroundColor && ! hasGradientColor ) {
		return null;
	}

	let backgroundSettings = {};
	if ( hasBackgroundColor ) {
		backgroundSettings = {
			colorValue: backgroundColor,
			onColorChange: setBackgroundColor,
		};
		if ( backgroundColor ) {
			backgroundSettings.clearable =
				backgroundColor === userBackgroundColor;
		}
	}

	let gradientSettings = {};
	if ( hasGradientColor ) {
		gradientSettings = {
			gradientValue: gradient,
			onGradientChange: setGradient,
		};
		if ( gradient ) {
			gradientSettings.clearable = gradient === userGradient;
		}
	}

	const controlProps = {
		...backgroundSettings,
		...gradientSettings,
	};

	return (
		<>
			<ScreenHeader
				back={ parentMenu + '/colors' }
				title={ __( 'Background' ) }
				description={ __(
					'Set a background color or gradient for the whole website.'
				) }
			/>
			<ColorGradientControl
				className="edit-site-screen-background-color__control"
				colors={ colorsPerOrigin }
				gradients={ gradientsPerOrigin }
				disableCustomColors={ ! areCustomSolidsEnabled }
				disableCustomGradients={ ! areCustomGradientsEnabled }
				__experimentalHasMultipleOrigins
				showTitle={ false }
				enableAlpha
				__experimentalIsRenderedInSidebar
				{ ...controlProps }
			/>
		</>
	);
}

export default ScreenBackgroundColor;
