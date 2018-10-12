/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { DOWN, ENTER, UP } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import IconButton from '../icon-button';
import { isValidHex } from './utils';
import TextControl from '../text-control';

/* Wrapper for TextControl, only used to handle intermediate state while typing. */
class Input extends Component {
	constructor( { value } ) {
		super( ...arguments );
		this.state = { value: String( value ).toLowerCase() };
		this.handleBlur = this.handleBlur.bind( this );
		this.handleChange = this.handleChange.bind( this );
		this.handleKeyDown = this.handleKeyDown.bind( this );
	}

	componentWillReceiveProps( nextProps ) {
		if ( nextProps.value !== this.props.value ) {
			this.setState( {
				value: String( nextProps.value ).toLowerCase(),
			} );
		}
	}

	handleBlur() {
		const { label, onChange } = this.props;
		const { value } = this.state;
		const propName = String( label ).toLowerCase();
		onChange( { [ propName ]: value } );
	}

	handleChange( value ) {
		const { label, onChange } = this.props;
		// Protect against expanding a value while we're typing.
		if ( value.length > 4 ) {
			const propName = String( label ).toLowerCase();
			onChange( { [ propName ]: value } );
		}
		this.setState( { value } );
	}

	handleKeyDown( { keyCode } ) {
		if ( keyCode !== ENTER && keyCode !== UP && keyCode !== DOWN ) {
			return;
		}
		const { value } = this.state;
		const { label, onChange } = this.props;
		const propName = String( label ).toLowerCase();
		onChange( { [ propName ]: value } );
	}

	render() {
		const { label, ...props } = this.props;
		const { value } = this.state;
		return (
			<TextControl
				className="components-color-picker__inputs-field"
				label={ label }
				value={ value }
				onChange={ ( newValue ) => this.handleChange( newValue ) }
				onBlur={ this.handleBlur }
				onKeyDown={ this.handleKeyDown }
				{ ...omit( props, [ 'onChange', 'value' ] ) }
			/>
		);
	}
}

export class Inputs extends Component {
	constructor( { hsl } ) {
		super( ...arguments );

		const view = hsl.a === 1 ? 'hex' : 'rgb';
		this.state = { view };

		this.toggleViews = this.toggleViews.bind( this );
		this.handleChange = this.handleChange.bind( this );
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
		} else if ( this.state.view === 'rgb' ) {
			this.setState( { view: 'hsl' } );
		} else if ( this.state.view === 'hsl' ) {
			if ( this.props.hsl.a === 1 ) {
				this.setState( { view: 'hex' } );
			} else {
				this.setState( { view: 'rgb' } );
			}
		}
	}

	handleChange( data ) {
		if ( data.hex ) {
			if ( isValidHex( data.hex ) ) {
				this.props.onChange( {
					hex: data.hex,
					source: 'hex',
				} );
			}
		} else if ( data.r || data.g || data.b ) {
			this.props.onChange( {
				r: data.r || this.props.rgb.r,
				g: data.g || this.props.rgb.g,
				b: data.b || this.props.rgb.b,
				source: 'rgb',
			} );
		} else if ( data.a ) {
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
			} );
		} else if ( data.h || data.s || data.l ) {
			// Remove any occurances of '%'.
			if ( typeof data.s === 'string' && data.s.includes( '%' ) ) {
				data.s = data.s.replace( '%', '' );
			}
			if ( typeof data.l === 'string' && data.l.includes( '%' ) ) {
				data.l = data.l.replace( '%', '' );
			}

			this.props.onChange( {
				h: data.h || this.props.hsl.h,
				s: Number( ( data.s && data.s ) || this.props.hsl.s ),
				l: Number( ( data.l && data.l ) || this.props.hsl.l ),
				source: 'hsl',
			} );
		}
	}

	renderFields() {
		const { disableAlpha = false } = this.props;
		if ( this.state.view === 'hex' ) {
			return (
				<fieldset>
					<legend className="screen-reader-text">
						{ __( 'Color value in HEX' ) }
					</legend>
					<div className="components-color-picker__inputs-fields">
						<Input
							label="hex"
							value={ this.props.hex }
							onChange={ this.handleChange }
						/>
					</div>
				</fieldset>
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
							value={ this.props.rgb.r }
							onChange={ this.handleChange }
							type="number"
							min="0"
							max="255"
						/>
						<Input
							label="g"
							value={ this.props.rgb.g }
							onChange={ this.handleChange }
							type="number"
							min="0"
							max="255"
						/>
						<Input
							label="b"
							value={ this.props.rgb.b }
							onChange={ this.handleChange }
							type="number"
							min="0"
							max="255"
						/>
						{ disableAlpha ? null : (
							<Input
								label="a"
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
					<legend className="screen-reader-text">
						{ __( 'Color value in HSL' ) }
					</legend>
					<div className="components-color-picker__inputs-fields">
						<Input
							label="h"
							value={ Math.round( this.props.hsl.h ) }
							onChange={ this.handleChange }
							type="number"
							min="0"
							max="359"
						/>
						<Input
							label="s"
							value={ Math.round( this.props.hsl.s * 100 ) }
							onChange={ this.handleChange }
							type="number"
							min="0"
							max="100"
						/>
						<Input
							label="l"
							value={ Math.round( this.props.hsl.l * 100 ) }
							onChange={ this.handleChange }
							type="number"
							min="0"
							max="100"
						/>
						{ disableAlpha ? null : (
							<Input
								label="a"
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
					<IconButton
						icon="arrow-down-alt2"
						label="Toggle input type"
						onClick={ this.toggleViews }
					/>
				</div>
			</div>
		);
	}
}

export default Inputs;
