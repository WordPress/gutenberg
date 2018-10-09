/**
 * External dependencies
 */
import classnames from 'classnames';
import { debounce, noop, partial } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Alpha from './alpha';
import Hue from './hue';
import Inputs from './inputs';
import Saturation from './saturation';
import { colorToState, simpleCheckForValidColor } from './utils';

export default class extends Component {
	constructor( { color = '0071a1' } ) {
		super( ...arguments );
		this.state = colorToState( color );
		this.handleChange = this.handleChange.bind( this );
	}

	handleChange( data ) {
		const { oldHue, onChangeComplete = noop } = this.props;
		const isValidColor = simpleCheckForValidColor( data );
		if ( isValidColor ) {
			const colors = colorToState( data, data.h || oldHue );
			this.setState(
				colors,
				debounce( partial( onChangeComplete, colors ), 100 )
			);
		}
	}

	render() {
		const { className, disableAlpha } = this.props;
		const { color, hex, hsl, hsv, rgb } = this.state;
		const classes = classnames( className, {
			'color-picker': true,
			'is-alpha-disabled': disableAlpha,
			'is-alpha-enabled': ! disableAlpha,
		} );

		return (
			<div className={ classes }>
				<div className="color-picker__saturation">
					<Saturation
						hsl={ hsl }
						hsv={ hsv }
						onChange={ this.handleChange }
					/>
				</div>

				<div className="color-picker__body">
					<div className="color-picker__controls flexbox-fix">
						<div className="color-picker__swatch">
							<div
								className="color-picker__active"
								style={ {
									backgroundColor: color && color.toRgbString(),
								} }
							/>
						</div>

						<div className="color-picker__toggles">
							<Hue hsl={ hsl } onChange={ this.handleChange } />
							{ disableAlpha ? null : (
								<Alpha
									rgb={ rgb }
									hsl={ hsl }
									onChange={ this.handleChange }
								/>
							) }
						</div>
					</div>

					<Inputs
						rgb={ rgb }
						hsl={ hsl }
						hex={ hex }
						onChange={ this.handleChange }
						disableAlpha={ disableAlpha }
					/>
				</div>
			</div>
		);
	}
}
