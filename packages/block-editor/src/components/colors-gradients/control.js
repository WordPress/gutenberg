/**
 * External dependencies
 */
import classnames from 'classnames';
import { every, isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import {
	BaseControl,
	__experimentalVStack as VStack,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	ColorPalette,
	GradientPicker,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

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

function ColorGradientControlInner( {
	colors,
	gradients,
	disableCustomColors,
	disableCustomGradients,
	__experimentalHasMultipleOrigins,
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
} ) {
	const canChooseAColor =
		onColorChange && ( ! isEmpty( colors ) || ! disableCustomColors );
	const canChooseAGradient =
		onGradientChange &&
		( ! isEmpty( gradients ) || ! disableCustomGradients );
	const [ currentTab, setCurrentTab ] = useState(
		gradientValue ? 'gradient' : !! canChooseAColor && 'color'
	);

	if ( ! canChooseAColor && ! canChooseAGradient ) {
		return null;
	}
	return (
		<BaseControl
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
						<ToggleGroupControl
							value={ currentTab }
							onChange={ setCurrentTab }
							label={ __( 'Select color type' ) }
							hideLabelFromVision
							isBlock
						>
							<ToggleGroupControlOption
								value="color"
								label={ __( 'Solid' ) }
							/>
							<ToggleGroupControlOption
								value="gradient"
								label={ __( 'Gradient' ) }
							/>
						</ToggleGroupControl>
					) }
					{ ( currentTab === 'color' || ! canChooseAGradient ) && (
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
							__experimentalHasMultipleOrigins={
								__experimentalHasMultipleOrigins
							}
							__experimentalIsRenderedInSidebar={
								__experimentalIsRenderedInSidebar
							}
							clearable={ clearable }
							enableAlpha={ enableAlpha }
						/>
					) }
					{ ( currentTab === 'gradient' || ! canChooseAColor ) && (
						<GradientPicker
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
							__experimentalHasMultipleOrigins={
								__experimentalHasMultipleOrigins
							}
							__experimentalIsRenderedInSidebar={
								__experimentalIsRenderedInSidebar
							}
							clearable={ clearable }
						/>
					) }
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
		every( colorsAndGradientKeys, ( key ) => props.hasOwnProperty( key ) )
	) {
		return <ColorGradientControlInner { ...props } />;
	}
	return <ColorGradientControlSelect { ...props } />;
}

export default ColorGradientControl;
