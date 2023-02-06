/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalColorGradientControl as ColorGradientControl,
	experiments as blockEditorExperiments,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import {
	useSupportedStyles,
	useColorsPerOrigin,
	useGradientsPerOrigin,
} from './hooks';
import { unlock } from '../../experiments';

const { useGlobalSetting, useGlobalStyle } = unlock( blockEditorExperiments );

function ScreenBackgroundColor( { name, variation = '' } ) {
	const prefix = variation ? `variations.${ variation }.` : '';
	const supports = useSupportedStyles( name );
	const [ areCustomSolidsEnabled ] = useGlobalSetting( 'color.custom', name );
	const [ areCustomGradientsEnabled ] = useGlobalSetting(
		'color.customGradient',
		name
	);
	const colorsPerOrigin = useColorsPerOrigin( name );
	const gradientsPerOrigin = useGradientsPerOrigin( name );

	const [ isBackgroundEnabled ] = useGlobalSetting(
		'color.background',
		name
	);

	const hasBackgroundColor =
		supports.includes( 'backgroundColor' ) &&
		isBackgroundEnabled &&
		( colorsPerOrigin.length > 0 || areCustomSolidsEnabled );
	const hasGradientColor =
		supports.includes( 'background' ) &&
		( gradientsPerOrigin.length > 0 || areCustomGradientsEnabled );
	const [ backgroundColor, setBackgroundColor ] = useGlobalStyle(
		prefix + 'color.background',
		name
	);
	const [ userBackgroundColor ] = useGlobalStyle(
		prefix + 'color.background',
		name,
		'user'
	);
	const [ gradient, setGradient ] = useGlobalStyle(
		prefix + 'color.gradient',
		name
	);
	const [ userGradient ] = useGlobalStyle(
		prefix + 'color.gradient',
		name,
		'user'
	);

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
				title={ __( 'Background' ) }
				description={ __(
					'Set a background color or gradient for the whole site.'
				) }
			/>
			<ColorGradientControl
				className={ classnames(
					'edit-site-screen-background-color__control',
					{
						'has-no-tabs':
							! hasBackgroundColor || ! hasGradientColor,
					}
				) }
				colors={ colorsPerOrigin }
				gradients={ gradientsPerOrigin }
				disableCustomColors={ ! areCustomSolidsEnabled }
				disableCustomGradients={ ! areCustomGradientsEnabled }
				showTitle={ false }
				enableAlpha
				__experimentalIsRenderedInSidebar
				headingLevel={ 3 }
				{ ...controlProps }
			/>
		</>
	);
}

export default ScreenBackgroundColor;
