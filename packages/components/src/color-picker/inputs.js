/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { DOWN, ENTER, UP } from '@wordpress/keycodes';
import { pure } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Button from '../button';
import TextControl from '../text-control';
import VisuallyHidden from '../visually-hidden';
import { isValidHex } from './utils';

/* Wrapper for TextControl, only used to handle intermediate state while typing. */
export class Input extends Component {
	constructor() {
		super( ...arguments );
		this.handleBlur = this.handleBlur.bind( this );
		this.handleChange = this.handleChange.bind( this );
		this.handleKeyDown = this.handleKeyDown.bind( this );
	}

	handleBlur() {
		const { value, valueKey, onChange, source } = this.props;
		onChange( {
			source,
			state: 'commit',
			value,
			valueKey,
		} );
	}

	handleChange( value ) {
		const { valueKey, onChange, source } = this.props;
		if ( value.length > 4 && isValidHex( value ) ) {
			onChange( {
				source,
				state: 'commit',
				value,
				valueKey,
			} );
		} else {
			onChange( {
				source,
				state: 'draft',
				value,
				valueKey,
			} );
		}
	}

	handleKeyDown( { keyCode } ) {
		if ( keyCode !== ENTER && keyCode !== UP && keyCode !== DOWN ) {
			return;
		}
		const { value, valueKey, onChange, source } = this.props;
		onChange( {
			source,
			state: 'commit',
			value,
			valueKey,
		} );
	}

	render() {
		const { label, value, ...props } = this.props;
		return (
			<TextControl
				className="components-color-picker__inputs-field"
				label={ label }
				value={ value }
				onChange={ ( newValue ) => this.handleChange( newValue ) }
				onBlur={ this.handleBlur }
				onKeyDown={ this.handleKeyDown }
				{ ...omit( props, [ 'onChange', 'valueKey', 'source' ] ) }
			/>
		);
	}
}

const PureButton = pure( Button );

export class Inputs extends Component {
	constructor( { hsl } ) {
		super( ...arguments );

		const view = hsl.a === 1 ? 'hex' : 'rgb';
		this.state = { view };

		this.toggleViews = this.toggleViews.bind( this );
		this.resetDraftValues = this.resetDraftValues.bind( this );
		this.handleChange = this.handleChange.bind( this );
		this.normalizeValue = this.normalizeValue.bind( this );
	}

	static getDerivedStateFromProps( props, state ) {
		if ( props.hsl.a !== 1 && state.view === 'hex' ) {
			return { view: 'rgb' };
		}
		return null;
	}

	toggleViews() {
		if ( this.state.view === 'hex' ) {
			this.setState( { view: 'rgb' }, this.resetDraftValues );

			speak( __( 'RGB mode active' ) );
		} else if ( this.state.view === 'rgb' ) {
			this.setState( { view: 'hsl' }, this.resetDraftValues );

			speak( __( 'Hue/saturation/lightness mode active' ) );
		} else if ( this.state.view === 'hsl' ) {
			if ( this.props.hsl.a === 1 ) {
				this.setState( { view: 'hex' }, this.resetDraftValues );

				speak( __( 'Hex color mode active' ) );
			} else {
				this.setState( { view: 'rgb' }, this.resetDraftValues );

				speak( __( 'RGB mode active' ) );
			}
		}
	}

	resetDraftValues() {
		return this.props.onChange( {
			state: 'reset',
		} );
	}

	normalizeValue( valueKey, value ) {
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

	handleChange( { source, state, value, valueKey } ) {
		this.props.onChange( {
			source,
			state,
			valueKey,
			value: this.normalizeValue( valueKey, value ),
		} );
	}

	renderFields() {
		const { disableAlpha = false } = this.props;
		if ( this.state.view === 'hex' ) {
			return (
				<div className="components-color-picker__inputs-fields">
					<Input
						source={ this.state.view }
						label={ __( 'Color value in hexadecimal' ) }
						valueKey="hex"
						value={ this.props.hex }
						onChange={ this.handleChange }
					/>
				</div>
			);
		} else if ( this.state.view === 'rgb' ) {
			return (
				<fieldset>
					<VisuallyHidden as="legend">
						{ __( 'Color value in RGB' ) }
					</VisuallyHidden>
					<div className="components-color-picker__inputs-fields">
						<Input
							source={ this.state.view }
							label="r"
							valueKey="r"
							value={ this.props.rgb.r }
							onChange={ this.handleChange }
							type="number"
							min="0"
							max="255"
						/>
						<Input
							source={ this.state.view }
							label="g"
							valueKey="g"
							value={ this.props.rgb.g }
							onChange={ this.handleChange }
							type="number"
							min="0"
							max="255"
						/>
						<Input
							source={ this.state.view }
							label="b"
							valueKey="b"
							value={ this.props.rgb.b }
							onChange={ this.handleChange }
							type="number"
							min="0"
							max="255"
						/>
						{ disableAlpha ? null : (
							<Input
								source={ this.state.view }
								label="a"
								valueKey="a"
								value={ this.props.rgb.a }
								onChange={ this.handleChange }
								type="number"
								min="0"
								max="1"
								step="0.05"
							/>
						) }
					</div>
				</fieldset>
			);
		} else if ( this.state.view === 'hsl' ) {
			return (
				<fieldset>
					<VisuallyHidden as="legend">
						{ __( 'Color value in HSL' ) }
					</VisuallyHidden>
					<div className="components-color-picker__inputs-fields">
						<Input
							source={ this.state.view }
							label="h"
							valueKey="h"
							value={ this.props.hsl.h }
							onChange={ this.handleChange }
							type="number"
							min="0"
							max="359"
						/>
						<Input
							source={ this.state.view }
							label="s"
							valueKey="s"
							value={ this.props.hsl.s }
							onChange={ this.handleChange }
							type="number"
							min="0"
							max="100"
						/>
						<Input
							source={ this.state.view }
							label="l"
							valueKey="l"
							value={ this.props.hsl.l }
							onChange={ this.handleChange }
							type="number"
							min="0"
							max="100"
						/>
						{ disableAlpha ? null : (
							<Input
								source={ this.state.view }
								label="a"
								valueKey="a"
								value={ this.props.hsl.a }
								onChange={ this.handleChange }
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

	render() {
		return (
			<div className="components-color-picker__inputs-wrapper">
				{ this.renderFields() }
				<div className="components-color-picker__inputs-toggle">
					<PureButton
						icon="arrow-down-alt2"
						label={ __( 'Change color format' ) }
						onClick={ this.toggleViews }
					/>
				</div>
			</div>
		);
	}
}

export default Inputs;
