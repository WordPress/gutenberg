/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { __experimentalColorGradientControl as ColorGradientControl } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import {
	getSupportedGlobalStylesPanels,
	useSetting,
	useStyle,
	useColorsPerOrigin,
	useGradientsPerOrigin,
} from './hooks';

function ScreenHeadingColor( { name } ) {
	const [ selectedLevel, setCurrentTab ] = useState( 'heading' );

	const supports = getSupportedGlobalStylesPanels( name );
	const [ solids ] = useSetting( 'color.palette', name );
	const [ gradients ] = useSetting( 'color.gradients', name );
	const [ areCustomSolidsEnabled ] = useSetting( 'color.custom', name );
	const [ areCustomGradientsEnabled ] = useSetting(
		'color.customGradient',
		name
	);
	const [ isTextEnabled ] = useSetting( 'color.text', name );
	const [ isBackgroundEnabled ] = useSetting( 'color.background', name );

	const colorsPerOrigin = useColorsPerOrigin( name );
	const gradientsPerOrigin = useGradientsPerOrigin( name );

	const hasTextColor =
		supports.includes( 'color' ) &&
		isTextEnabled &&
		( solids.length > 0 || areCustomSolidsEnabled );

	const hasBackgroundColor =
		supports.includes( 'backgroundColor' ) &&
		isBackgroundEnabled &&
		( solids.length > 0 || areCustomSolidsEnabled );
	const hasGradientColor =
		supports.includes( 'background' ) &&
		( gradients.length > 0 || areCustomGradientsEnabled );

	const [ color, setColor ] = useStyle(
		'elements.' + selectedLevel + '.color.text',
		name
	);
	const [ userColor ] = useStyle(
		'elements.' + selectedLevel + '.color.text',
		name,
		'user'
	);

	const [ backgroundColor, setBackgroundColor ] = useStyle(
		'elements.' + selectedLevel + '.color.background',
		name
	);
	const [ userBackgroundColor ] = useStyle(
		'elements.' + selectedLevel + '.color.background',
		name,
		'user'
	);
	const [ gradient, setGradient ] = useStyle(
		'elements.' + selectedLevel + '.color.gradient',
		name
	);
	const [ userGradient ] = useStyle(
		'elements.' + selectedLevel + '.color.gradient',
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
				<ToggleGroupControl
					label={ __( 'Heading Level' ) }
					value={ selectedLevel }
					onChange={ setCurrentTab }
					isBlock
				>
					<ToggleGroupControlOption
						value="heading"
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
					<h4>{ __( 'Text color' ) }</h4>

					<ColorGradientControl
						className="edit-site-screen-heading-text-color__control"
						colors={ colorsPerOrigin }
						disableCustomColors={ ! areCustomSolidsEnabled }
						__experimentalHasMultipleOrigins
						showTitle={ false }
						enableAlpha
						__experimentalIsRenderedInSidebar
						colorValue={ color }
						onColorChange={ setColor }
						clearable={ color === userColor }
					/>
				</div>
			) }
			{ hasBackgroundColor && (
				<div className="edit-site-global-styles-screen-heading-color">
					<h4>{ __( 'Background color' ) }</h4>

					<ColorGradientControl
						className="edit-site-screen-heading-background-color__control"
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
				</div>
			) }
		</>
	);
}

export default ScreenHeadingColor;
