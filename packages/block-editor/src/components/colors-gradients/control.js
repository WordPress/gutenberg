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
	TabPanel,
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

const TAB_COLOR = {
	name: 'color',
	title: 'Solid color',
	value: 'color',
};
const TAB_GRADIENT = {
	name: 'gradient',
	title: 'Gradient',
	value: 'gradient',
};

const TABS_SETTINGS = [ TAB_COLOR, TAB_GRADIENT ];

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
		gradientValue
			? TAB_GRADIENT.value
			: !! canChooseAColor && TAB_COLOR.value
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
						<TabPanel
							className="block-editor-color-gradient-control__tabs"
							onSelect={ setCurrentTab }
							tabs={ TABS_SETTINGS }
						>
						{ ( tab ) => <p className="screen-reader-text">Selected tab: { tab.title }</p> }
						</TabPanel>
					) }
					{ ( currentTab === TAB_COLOR.value ||
						! canChooseAGradient ) && (
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
					{ ( currentTab === TAB_GRADIENT.value ||
						! canChooseAColor ) && (
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
