/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	BaseControl,
	__experimentalVStack as VStack,
	TabPanel,
	ColorPalette,
	GradientPicker,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import useSetting from '../use-setting';

const colorsAndGradientKeys = [
	'colors',
	'disableCustomColors',
	'gradients',
	'disableCustomGradients',
];

const TAB_COLOR = {
	name: 'color',
	title: __( 'Solid' ),
	value: 'color',
};
const TAB_GRADIENT = {
	name: 'gradient',
	title: __( 'Gradient' ),
	value: 'gradient',
};

const TABS_SETTINGS = [ TAB_COLOR, TAB_GRADIENT ];

function ColorGradientControlInner( {
	colors,
	gradients,
	disableCustomColors,
	disableCustomGradients,
	__experimentalIsRenderedInSidebar,
	className,
	label,
	onColorChange,
	onGradientChange,
	colorValue,
	gradientValue,
	clearable,
	showTitle = true,
	enableAlpha,
	headingLevel,
} ) {
	const canChooseAColor =
		onColorChange &&
		( ( colors && colors.length > 0 ) || ! disableCustomColors );
	const canChooseAGradient =
		onGradientChange &&
		( ( gradients && gradients.length > 0 ) || ! disableCustomGradients );

	if ( ! canChooseAColor && ! canChooseAGradient ) {
		return null;
	}

	const tabPanels = {
		[ TAB_COLOR.value ]: (
			<ColorPalette
				value={ colorValue }
				onChange={
					canChooseAGradient
						? ( newColor ) => {
								onColorChange( newColor );
								onGradientChange();
						  }
						: onColorChange
				}
				{ ...{ colors, disableCustomColors } }
				__experimentalIsRenderedInSidebar={
					__experimentalIsRenderedInSidebar
				}
				clearable={ clearable }
				enableAlpha={ enableAlpha }
				headingLevel={ headingLevel }
			/>
		),
		[ TAB_GRADIENT.value ]: (
			<GradientPicker
				__nextHasNoMargin
				value={ gradientValue }
				onChange={
					canChooseAColor
						? ( newGradient ) => {
								onGradientChange( newGradient );
								onColorChange();
						  }
						: onGradientChange
				}
				{ ...{ gradients, disableCustomGradients } }
				__experimentalIsRenderedInSidebar={
					__experimentalIsRenderedInSidebar
				}
				clearable={ clearable }
				headingLevel={ headingLevel }
			/>
		),
	};

	const renderPanelType = ( type ) => (
		<div className="block-editor-color-gradient-control__panel">
			{ tabPanels[ type ] }
		</div>
	);

	return (
		<BaseControl
			__nextHasNoMarginBottom
			className={ classnames(
				'block-editor-color-gradient-control',
				className
			) }
		>
			<fieldset className="block-editor-color-gradient-control__fieldset">
				<VStack spacing={ 1 }>
					{ showTitle && (
						<legend>
							<div className="block-editor-color-gradient-control__color-indicator">
								<BaseControl.VisualLabel>
									{ label }
								</BaseControl.VisualLabel>
							</div>
						</legend>
					) }
					{ canChooseAColor && canChooseAGradient && (
						<TabPanel
							className="block-editor-color-gradient-control__tabs"
							tabs={ TABS_SETTINGS }
							initialTabName={
								gradientValue
									? TAB_GRADIENT.value
									: !! canChooseAColor && TAB_COLOR.value
							}
						>
							{ ( tab ) => renderPanelType( tab.value ) }
						</TabPanel>
					) }
					{ ! canChooseAGradient &&
						renderPanelType( TAB_COLOR.value ) }
					{ ! canChooseAColor &&
						renderPanelType( TAB_GRADIENT.value ) }
				</VStack>
			</fieldset>
		</BaseControl>
	);
}

function ColorGradientControlSelect( props ) {
	const colorGradientSettings = {};
	colorGradientSettings.colors = useSetting( 'color.palette' );
	colorGradientSettings.gradients = useSetting( 'color.gradients' );
	colorGradientSettings.disableCustomColors = ! useSetting( 'color.custom' );
	colorGradientSettings.disableCustomGradients = ! useSetting(
		'color.customGradient'
	);

	return (
		<ColorGradientControlInner
			{ ...{ ...colorGradientSettings, ...props } }
		/>
	);
}

function ColorGradientControl( props ) {
	if (
		colorsAndGradientKeys.every( ( key ) => props.hasOwnProperty( key ) )
	) {
		return <ColorGradientControlInner { ...props } />;
	}
	return <ColorGradientControlSelect { ...props } />;
}

export default ColorGradientControl;
