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
import IconButton from '../icon-button';
import TextControl from '../text-control';
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
		const { value, valueKey, onChange } = this.props;
		onChange( {
			state: 'commit',
			[ valueKey ]: value,
		} );
	}

	handleChange( value ) {
		const { valueKey, onChange } = this.props;
		if ( value.length > 4 && isValidHex( value ) ) {
			onChange( {
				state: 'commit',
				[ valueKey ]: value,
			} );
		} else {
			onChange( {
				state: 'draft',
				[ valueKey ]: value,
			} );
		}
	}

	handleKeyDown( { keyCode } ) {
		if ( keyCode !== ENTER && keyCode !== UP && keyCode !== DOWN ) {
			return;
		}
		const { value, valueKey, onChange } = this.props;
		onChange( {
			state: 'commit',
			[ valueKey ]: value,
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
				{ ...omit( props, [ 'onChange', 'valueKey' ] ) }
			/>
		);
	}
}

const PureIconButton = pure( IconButton );

export class Inputs extends Component {
	constructor( { hsl } ) {
		super( ...arguments );

		const view = hsl.a === 1 ? 'hex' : 'rgb';
		this.state = { view };

		this.toggleViews = this.toggleViews.bind( this );
		this.handleHEXChange = this.handleHEXChange.bind( this );
		this.handleRChange = this.handleRChange.bind( this );
		this.handleGChange = this.handleGChange.bind( this );
		this.handleBChange = this.handleBChange.bind( this );
		this.handleHChange = this.handleHChange.bind( this );
		this.handleSChange = this.handleSChange.bind( this );
		this.handleLChange = this.handleLChange.bind( this );
	}

	static getDerivedStateFromProps( props, state ) {
		if ( props.hsl.a !== 1 && state.view === 'hex' ) {
			return { view: 'rgb' };
		}
		return null;
	}

	toggleViews() {
		if ( this.state.view === 'hex' ) {
			this.setState( { view: 'rgb' } );

			speak( __( 'RGB mode active' ) );
		} else if ( this.state.view === 'rgb' ) {
			this.setState( { view: 'hsl' } );

			speak( __( 'Hue/saturation/lightness mode active' ) );
		} else if ( this.state.view === 'hsl' ) {
			if ( this.props.hsl.a === 1 ) {
				this.setState( { view: 'hex' } );

				speak( __( 'Hex color mode active' ) );
			} else {
				this.setState( { view: 'rgb' } );

				speak( __( 'RGB mode active' ) );
			}
		}
	}

	handleHEXChange( data ) {
		this.props.onChange( {
			hex: data.hex,
			source: 'hex',
			state: data.state,
		} );
	}

	handleRChange( data ) {
		this.props.onChange( {
			r: data.r,
			g: this.props.rgb.g,
			b: this.props.rgb.b,
			source: 'rgb',
			state: data.state,
		} );
	}

	handleGChange( data ) {
		this.props.onChange( {
			r: this.props.rgb.r,
			g: data.g,
			b: this.props.rgb.b,
			source: 'rgb',
			state: data.state,
		} );
	}

	handleBChange( data ) {
		this.props.onChange( {
			r: this.props.rgb.r,
			g: this.props.rgb.g,
			b: data.b,
			source: 'rgb',
			state: data.state,
		} );
	}

	handleAChange( data ) {
		if ( data.a < 0 ) {
			data.a = 0;
		} else if ( data.a > 1 ) {
			data.a = 1;
		}

		this.props.onChange( {
			h: this.props.hsl.h,
			s: this.props.hsl.s,
			l: this.props.hsl.l,
			a: Math.round( data.a * 100 ) / 100,
			source: 'rgb',
			state: data.state,
		} );
	}

	handleHChange( data ) {
		this.props.onChange( {
			h: data.h,
			s: this.props.hsl.s,
			l: this.props.hsl.l,
			source: 'hsl',
			state: data.state,
		} );
	}

	handleSChange( data ) {
		this.props.onChange( {
			h: this.props.hsl.h,
			s: data.s,
			l: this.props.hsl.l,
			source: 'hsl',
			state: data.state,
		} );
	}

	handleLChange( data ) {
		this.props.onChange( {
			h: this.props.hsl.h,
			s: this.props.hsl.s,
			l: data.l,
			source: 'hsl',
			state: data.state,
		} );
	}

	renderFields() {
		const { disableAlpha = false } = this.props;
		if ( this.state.view === 'hex' ) {
			return (
				<div className="components-color-picker__inputs-fields">
					<Input
						label={ __( 'Color value in hexadecimal' ) }
						valueKey="hex"
						value={ this.props.hex }
						onChange={ this.handleHEXChange }
					/>
				</div>
			);
		} else if ( this.state.view === 'rgb' ) {
			return (
				<fieldset>
					<legend className="screen-reader-text">
						{ __( 'Color value in RGB' ) }
					</legend>
					<div className="components-color-picker__inputs-fields">
						<Input
							label="r"
							valueKey="r"
							value={ this.props.rgb.r }
							onChange={ this.handleRChange }
							type="number"
							min="0"
							max="255"
						/>
						<Input
							label="g"
							valueKey="g"
							value={ this.props.rgb.g }
							onChange={ this.handleGChange }
							type="number"
							min="0"
							max="255"
						/>
						<Input
							label="b"
							valueKey="b"
							value={ this.props.rgb.b }
							onChange={ this.handleBChange }
							type="number"
							min="0"
							max="255"
						/>
						{ disableAlpha ? null : (
							<Input
								label="a"
								valueKey="a"
								value={ this.props.rgb.a }
								onChange={ this.handleAChange }
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
					<legend className="screen-reader-text">
						{ __( 'Color value in HSL' ) }
					</legend>
					<div className="components-color-picker__inputs-fields">
						<Input
							label="h"
							valueKey="h"
							value={ this.props.hsl.h }
							onChange={ this.handleHChange }
							type="number"
							min="0"
							max="359"
						/>
						<Input
							label="s"
							valueKey="s"
							value={ this.props.hsl.s }
							onChange={ this.handleSChange }
							type="number"
							min="0"
							max="100"
						/>
						<Input
							label="l"
							valueKey="l"
							value={ this.props.hsl.l }
							onChange={ this.handleLChange }
							type="number"
							min="0"
							max="100"
						/>
						{ disableAlpha ? null : (
							<Input
								label="a"
								valueKey="a"
								value={ this.props.hsl.a }
								onChange={ this.handleAChange }
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
					<PureIconButton
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
