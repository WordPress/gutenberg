/**
 * External dependencies
 */
import classnames from 'classnames';
import { every, isEmpty, pick } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import {
	BaseControl,
	Button,
	ButtonGroup,
	ColorIndicator,
	ColorPalette,
	__experimentalGradientPicker as GradientPicker,
} from '@wordpress/components';
import { sprintf, __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { getColorObjectByColorValue } from '../colors';
import { __experimentalGetGradientObjectByGradientValue } from '../gradients';

// translators: first %s: the color name or value (e.g. red or #ff0000)
const colorIndicatorAriaLabel = __( '(Color: %s)' );

// translators: first %s: the gradient name or value (e.g. red to green or linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%)
const gradientIndicatorAriaLabel = __( '(Gradient: %s)' );

const colorsAndGradientKeys = [
	'colors',
	'disableCustomColors',
	'gradients',
	'disableCustomGradients',
];

function VisualLabel( {
	colors,
	gradients,
	label,
	currentTab,
	colorValue,
	gradientValue,
} ) {
	let value, ariaLabel;
	if ( currentTab === 'color' ) {
		if ( colorValue ) {
			value = colorValue;
			const colorObject = getColorObjectByColorValue( colors, value );
			const colorName = colorObject && colorObject.name;
			ariaLabel = sprintf( colorIndicatorAriaLabel, colorName || value );
		}
	} else if ( currentTab === 'gradient' && gradientValue ) {
		value = gradientValue;
		const gradientObject = __experimentalGetGradientObjectByGradientValue(
			gradients,
			value
		);
		const gradientName = gradientObject && gradientObject.name;
		ariaLabel = sprintf(
			gradientIndicatorAriaLabel,
			gradientName || value
		);
	}

	return (
		<>
			{ label }
			{ !! value && (
				<ColorIndicator colorValue={ value } aria-label={ ariaLabel } />
			) }
		</>
	);
}

function ColorGradientControlInner( {
	colors,
	gradients,
	disableCustomColors,
	disableCustomGradients,
	className,
	label,
	onColorChange,
	onGradientChange,
	colorValue,
	gradientValue,
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
			<fieldset>
				<legend>
					<div className="block-editor-color-gradient-control__color-indicator">
						<BaseControl.VisualLabel>
							<VisualLabel
								currentTab={ currentTab }
								label={ label }
								colorValue={ colorValue }
								gradientValue={ gradientValue }
							/>
						</BaseControl.VisualLabel>
					</div>
				</legend>
				{ canChooseAColor && canChooseAGradient && (
					<ButtonGroup className="block-editor-color-gradient-control__button-tabs">
						<Button
							isSmall
							isPrimary={ currentTab === 'color' }
							isSecondary={ currentTab !== 'color' }
							onClick={ () => setCurrentTab( 'color' ) }
						>
							{ __( 'Solid' ) }
						</Button>
						<Button
							isSmall
							isPrimary={ currentTab === 'gradient' }
							isSecondary={ currentTab !== 'gradient' }
							onClick={ () => setCurrentTab( 'gradient' ) }
						>
							{ __( 'Gradient' ) }
						</Button>
					</ButtonGroup>
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
					/>
				) }
			</fieldset>
		</BaseControl>
	);
}

function ColorGradientControlSelect( props ) {
	const colorGradientSettings = useSelect( ( select ) => {
		const settings = select( 'core/block-editor' ).getSettings();
		return pick( settings, colorsAndGradientKeys );
	} );
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
