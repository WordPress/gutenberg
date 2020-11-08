/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { DOWN, ENTER, UP } from '@wordpress/keycodes';
import { chevronDown } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Button from '../button';
import TextControl from '../text-control';
import VisuallyHidden from '../visually-hidden';
import { isValidHex } from './utils';

/* Wrapper for TextControl, only used to handle intermediate state while typing. */

export function Input( {
	label,
	value,
	valueKey,
	onChange,
	source,
	...props
} ) {
	function handleBlur() {
		onChange( {
			source,
			state: 'commit',
			value,
			valueKey,
		} );
	}

	function handleChange( newValue ) {
		if ( newValue.length > 4 && isValidHex( newValue ) ) {
			onChange( {
				source,
				state: 'commit',
				value: newValue,
				valueKey,
			} );
		} else {
			onChange( {
				source,
				state: 'draft',
				value: newValue,
				valueKey,
			} );
		}
	}

	function handleKeyDown( { keyCode } ) {
		if ( keyCode !== ENTER && keyCode !== UP && keyCode !== DOWN ) {
			return;
		}
		onChange( {
			source,
			state: 'commit',
			value,
			valueKey,
		} );
	}

	return (
		<TextControl
			className="components-color-picker__inputs-field"
			label={ label }
			value={ value }
			onChange={ ( newValue ) => handleChange( newValue ) }
			onBlur={ handleBlur }
			onKeyDown={ handleKeyDown }
			{ ...props }
		/>
	);
}

function normalizeValue( valueKey, value ) {
	if ( valueKey !== 'a' ) {
		return value;
	}

	if ( value < 0 ) {
		return 0;
	} else if ( value > 1 ) {
		return 1;
	}
	return Math.round( value * 100 ) / 100;
}

export default function Inputs( {
	hex,
	rgb,
	hsl,
	onChange,
	disableAlpha = false,
} ) {
	const [ view, setView ] = useState( hsl.a === 1 ? 'hex' : 'rgb' );

	if ( hsl.a !== 1 && view === 'hex' ) {
		setView( 'rgb' );
	}

	function toggleViews() {
		if ( view === 'hex' ) {
			setView( 'rgb' );
			resetDraftValues();

			speak( __( 'RGB mode active' ) );
		} else if ( view === 'rgb' ) {
			setView( 'hsl' );
			resetDraftValues();

			speak( __( 'Hue/saturation/lightness mode active' ) );
		} else if ( view === 'hsl' ) {
			if ( hsl.a === 1 ) {
				setView( 'hex' );
				resetDraftValues();

				speak( __( 'Hex color mode active' ) );
			} else {
				setView( 'rgb' );
				resetDraftValues();

				speak( __( 'RGB mode active' ) );
			}
		}
	}

	function resetDraftValues() {
		return onChange( {
			state: 'reset',
		} );
	}

	function handleChange( { source, state, value, valueKey } ) {
		onChange( {
			source,
			state,
			valueKey,
			value: normalizeValue( valueKey, value ),
		} );
	}

	function renderFields() {
		if ( view === 'hex' ) {
			return (
				<div className="components-color-picker__inputs-fields">
					<Input
						source={ view }
						label={ __( 'Color value in hexadecimal' ) }
						valueKey="hex"
						value={ hex }
						onChange={ handleChange }
					/>
				</div>
			);
		} else if ( view === 'rgb' ) {
			const legend = disableAlpha
				? __( 'Color value in RGB' )
				: __( 'Color value in RGBA' );
			return (
				<fieldset>
					<VisuallyHidden as="legend">{ legend }</VisuallyHidden>
					<div className="components-color-picker__inputs-fields">
						<Input
							source={ view }
							label="r"
							valueKey="r"
							value={ rgb.r }
							onChange={ handleChange }
							type="number"
							min="0"
							max="255"
						/>
						<Input
							source={ view }
							label="g"
							valueKey="g"
							value={ rgb.g }
							onChange={ handleChange }
							type="number"
							min="0"
							max="255"
						/>
						<Input
							source={ view }
							label="b"
							valueKey="b"
							value={ rgb.b }
							onChange={ handleChange }
							type="number"
							min="0"
							max="255"
						/>
						{ disableAlpha ? null : (
							<Input
								source={ view }
								label="a"
								valueKey="a"
								value={ rgb.a }
								onChange={ handleChange }
								type="number"
								min="0"
								max="1"
								step="0.01"
							/>
						) }
					</div>
				</fieldset>
			);
		} else if ( view === 'hsl' ) {
			const legend = disableAlpha
				? __( 'Color value in HSL' )
				: __( 'Color value in HSLA' );
			return (
				<fieldset>
					<VisuallyHidden as="legend">{ legend }</VisuallyHidden>
					<div className="components-color-picker__inputs-fields">
						<Input
							source={ view }
							label="h"
							valueKey="h"
							value={ hsl.h }
							onChange={ handleChange }
							type="number"
							min="0"
							max="359"
						/>
						<Input
							source={ view }
							label="s"
							valueKey="s"
							value={ hsl.s }
							onChange={ handleChange }
							type="number"
							min="0"
							max="100"
						/>
						<Input
							source={ view }
							label="l"
							valueKey="l"
							value={ hsl.l }
							onChange={ handleChange }
							type="number"
							min="0"
							max="100"
						/>
						{ disableAlpha ? null : (
							<Input
								source={ view }
								label="a"
								valueKey="a"
								value={ hsl.a }
								onChange={ handleChange }
								type="number"
								min="0"
								max="1"
								step="0.05"
							/>
						) }
					</div>
				</fieldset>
			);
		}
	}

	return (
		<div className="components-color-picker__inputs-wrapper">
			{ renderFields() }
			<div className="components-color-picker__inputs-toggle-wrapper">
				<Button
					className="components-color-picker__inputs-toggle"
					icon={ chevronDown }
					label={ __( 'Change color format' ) }
					onClick={ toggleViews }
				/>
			</div>
		</div>
	);
}
