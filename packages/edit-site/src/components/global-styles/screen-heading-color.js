/**
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import {
	__experimentalColorGradientControl as ColorGradientControl,
	experiments as blockEditorExperiments,
} from '@wordpress/block-editor';
import { useState } from '@wordpress/element';

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

function ScreenHeadingColor( { name, variation = '' } ) {
	const prefix = variation ? `variations.${ variation }.` : '';
	const [ selectedLevel, setCurrentTab ] = useState( 'heading' );
	const supports = useSupportedStyles( name );
	const [ areCustomSolidsEnabled ] = useGlobalSetting( 'color.custom', name );
	const [ areCustomGradientsEnabled ] = useGlobalSetting(
		'color.customGradient',
		name
	);
	const [ isTextEnabled ] = useGlobalSetting( 'color.text', name );
	const [ isBackgroundEnabled ] = useGlobalSetting(
		'color.background',
		name
	);
	const colorsPerOrigin = useColorsPerOrigin( name );
	const gradientsPerOrigin = useGradientsPerOrigin( name );

	const hasTextColor =
		supports.includes( 'color' ) &&
		isTextEnabled &&
		( colorsPerOrigin.length > 0 || areCustomSolidsEnabled );

	const hasBackgroundColor =
		supports.includes( 'backgroundColor' ) &&
		isBackgroundEnabled &&
		( colorsPerOrigin.length > 0 || areCustomSolidsEnabled );
	const hasGradientColor =
		supports.includes( 'background' ) &&
		( gradientsPerOrigin.length > 0 || areCustomGradientsEnabled );

	const [ color, setColor ] = useGlobalStyle(
		prefix + 'elements.' + selectedLevel + '.color.text',
		name
	);
	const [ userColor ] = useGlobalStyle(
		prefix + 'elements.' + selectedLevel + '.color.text',
		name,
		'user'
	);

	const [ backgroundColor, setBackgroundColor ] = useGlobalStyle(
		prefix + 'elements.' + selectedLevel + '.color.background',
		name
	);
	const [ userBackgroundColor ] = useGlobalStyle(
		prefix + 'elements.' + selectedLevel + '.color.background',
		name,
		'user'
	);
	const [ gradient, setGradient ] = useGlobalStyle(
		prefix + 'elements.' + selectedLevel + '.color.gradient',
		name
	);
	const [ userGradient ] = useGlobalStyle(
		prefix + 'elements.' + selectedLevel + '.color.gradient',
		name,
		'user'
	);

	if ( ! hasTextColor && ! hasBackgroundColor && ! hasGradientColor ) {
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
				title={ __( 'Headings' ) }
				description={ __(
					'Set the default color used for headings across the site.'
				) }
			/>
			<div className="edit-site-global-styles-screen-heading-color">
				<h3>{ __( 'Select heading level' ) }</h3>

				<ToggleGroupControl
					__nextHasNoMarginBottom
					label={ __( 'Select heading level' ) }
					hideLabelFromVision={ true }
					value={ selectedLevel }
					onChange={ setCurrentTab }
					isBlock
				>
					<ToggleGroupControlOption
						value="heading"
						/* translators: 'All' refers to selecting all heading levels
						and applying the same style to h1-h6. */
						label={ __( 'All' ) }
					/>
					<ToggleGroupControlOption value="h1" label={ __( 'H1' ) } />
					<ToggleGroupControlOption value="h2" label={ __( 'H2' ) } />
					<ToggleGroupControlOption value="h3" label={ __( 'H3' ) } />
					<ToggleGroupControlOption value="h4" label={ __( 'H4' ) } />
					<ToggleGroupControlOption value="h5" label={ __( 'H5' ) } />
					<ToggleGroupControlOption value="h6" label={ __( 'H6' ) } />
				</ToggleGroupControl>
			</div>
			{ hasTextColor && (
				<div className="edit-site-global-styles-screen-heading-color">
					<h3>
						{ selectedLevel === 'heading'
							? __( 'Text color for all heading levels' )
							: sprintf(
									/* translators: %s: heading level (h1-h6) */
									__( 'Text color for %s' ),
									selectedLevel.toUpperCase()
							  ) }
					</h3>
					<ColorGradientControl
						className="edit-site-screen-heading-text-color__control"
						colors={ colorsPerOrigin }
						disableCustomColors={ ! areCustomSolidsEnabled }
						showTitle={ false }
						enableAlpha
						__experimentalIsRenderedInSidebar
						colorValue={ color }
						onColorChange={ setColor }
						clearable={ color === userColor }
						headingLevel={ 4 }
					/>
				</div>
			) }
			{ hasBackgroundColor && (
				<div className="edit-site-global-styles-screen-heading-color">
					<h3>
						{ selectedLevel === 'heading'
							? __( 'Background color for all heading levels' )
							: sprintf(
									/* translators: %s: heading level (h1-h6) */
									__( 'Background color for %s' ),
									selectedLevel.toUpperCase()
							  ) }
					</h3>
					<ColorGradientControl
						className="edit-site-screen-heading-background-color__control"
						colors={ colorsPerOrigin }
						gradients={ gradientsPerOrigin }
						disableCustomColors={ ! areCustomSolidsEnabled }
						disableCustomGradients={ ! areCustomGradientsEnabled }
						showTitle={ false }
						enableAlpha
						__experimentalIsRenderedInSidebar
						headingLevel={ 4 }
						{ ...controlProps }
					/>
				</div>
			) }
		</>
	);
}

export default ScreenHeadingColor;
