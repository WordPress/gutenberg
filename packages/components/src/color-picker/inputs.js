/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import IconButton from '../icon-button';
import { isValidHex } from './utils';
import TextControl from '../text-control';

export class Inputs extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			view: '',
		};

		this.toggleViews = this.toggleViews.bind( this );
		this.handleChange = this.handleChange.bind( this );
	}

	componentDidMount() {
		if ( this.props.hsl.a === 1 && this.state.view !== 'hex' ) {
			this.setState( { view: 'hex' } );
		} else if ( this.state.view !== 'rgb' && this.state.view !== 'hsl' ) {
			this.setState( { view: 'rgb' } );
		}
	}

	componentWillReceiveProps( nextProps ) {
		if ( nextProps.hsl.a !== 1 && this.state.view === 'hex' ) {
			this.setState( { view: 'rgb' } );
		}
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
				<fieldset className="components-color-picker__inputs-fields">
					<legend className="screen-reader-text">
						{ __( 'Color value in HEX' ) }
					</legend>
					<TextControl
						className="components-color-picker__inputs-field"
						label="hex"
						value={ this.props.hex }
						onChange={ ( value ) => this.handleChange( { hex: value } ) }
					/>
				</fieldset>
			);
		} else if ( this.state.view === 'rgb' ) {
			return (
				<fieldset className="components-color-picker__inputs-fields">
					<legend className="screen-reader-text">
						{ __( 'Color value in RGB' ) }
					</legend>
					<TextControl
						className="components-color-picker__inputs-field"
						label="r"
						type="number"
						min="0"
						max="255"
						value={ this.props.rgb.r }
						onChange={ ( value ) => this.handleChange( { r: value } ) }
					/>
					<TextControl
						className="components-color-picker__inputs-field"
						label="g"
						type="number"
						min="0"
						max="255"
						value={ this.props.rgb.g }
						onChange={ ( value ) => this.handleChange( { g: value } ) }
					/>
					<TextControl
						className="components-color-picker__inputs-field"
						label="b"
						type="number"
						min="0"
						max="255"
						value={ this.props.rgb.b }
						onChange={ ( value ) => this.handleChange( { b: value } ) }
					/>
					{ disableAlpha ? null : (
						<TextControl
							className="components-color-picker__inputs-field"
							label="a"
							type="number"
							min="0"
							max="1"
							step="0.05"
							value={ this.props.rgb.a }
							onChange={ ( value ) =>
								this.handleChange( { a: value } )
							}
						/>
					) }
				</fieldset>
			);
		} else if ( this.state.view === 'hsl' ) {
			return (
				<fieldset className="components-color-picker__inputs-fields">
					<legend className="screen-reader-text">
						{ __( 'Color value in HSL' ) }
					</legend>
					<TextControl
						className="components-color-picker__inputs-field"
						label="h"
						type="number"
						min="0"
						max="359"
						value={ Math.round( this.props.hsl.h ) }
						onChange={ ( value ) => this.handleChange( { h: value } ) }
					/>
					<TextControl
						className="components-color-picker__inputs-field"
						label="s"
						type="number"
						min="0"
						max="100"
						value={ Math.round( this.props.hsl.s * 100 ) }
						onChange={ ( value ) => this.handleChange( { s: value } ) }
					/>
					<TextControl
						className="components-color-picker__inputs-field"
						label="l"
						type="number"
						min="0"
						max="100"
						value={ Math.round( this.props.hsl.l * 100 ) }
						onChange={ ( value ) => this.handleChange( { l: value } ) }
					/>
					{ disableAlpha ? null : (
						<TextControl
							className="components-color-picker__inputs-field"
							label="a"
							type="number"
							min="0"
							max="1"
							step="0.05"
							value={ this.props.hsl.a }
							onChange={ ( value ) =>
								this.handleChange( { a: value } )
							}
						/>
					) }
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
