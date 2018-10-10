/**
 * External dependencies
 */
import Mousetrap from 'mousetrap';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { calculateAlphaChange } from './utils';

export class Alpha extends Component {
	constructor() {
		super( ...arguments );

		this.increase = this.increase.bind( this );
		this.decrease = this.decrease.bind( this );
		this.handleChange = this.handleChange.bind( this );
		this.handleMouseDown = this.handleMouseDown.bind( this );
		this.handleMouseUp = this.handleMouseUp.bind( this );
	}

	componentDidMount() {
		this.mousetrap = new Mousetrap( this.container );
		this.mousetrap.bind( 'up', () => this.increase() );
		this.mousetrap.bind( 'right', () => this.increase() );
		this.mousetrap.bind( 'shift+up', () => this.increase( 0.1 ) );
		this.mousetrap.bind( 'shift+right', () => this.increase( 0.1 ) );
		this.mousetrap.bind( 'pageup', () => this.increase( 0.1 ) );
		this.mousetrap.bind( 'end', () => this.increase( 1 ) );
		this.mousetrap.bind( 'down', () => this.decrease() );
		this.mousetrap.bind( 'left', () => this.decrease() );
		this.mousetrap.bind( 'shift+down', () => this.decrease( 0.1 ) );
		this.mousetrap.bind( 'shift+left', () => this.decrease( 0.1 ) );
		this.mousetrap.bind( 'pagedown', () => this.decrease( 0.1 ) );
		this.mousetrap.bind( 'home', () => this.decrease( 1 ) );
	}

	componentWillUnmount() {
		this.unbindEventListeners();
		this.mousetrap.reset();
	}

	increase( amount = 0.01 ) {
		const { hsl, onChange = noop } = this.props;
		amount = parseInt( amount * 100, 10 );
		const change = {
			h: hsl.h,
			s: hsl.s,
			l: hsl.l,
			a: ( parseInt( hsl.a * 100, 10 ) + amount ) / 100,
			source: 'rgb',
		};
		onChange( change );
	}

	decrease( amount = 0.01 ) {
		const { hsl, onChange = noop } = this.props;
		const change = {
			h: hsl.h,
			s: hsl.s,
			l: hsl.l,
			a:
				hsl.a <= amount ?
					0 :
					( parseInt( hsl.a * 100, 10 ) - parseInt( amount * 100, 10 ) ) / 100,
			source: 'rgb',
		};
		onChange( change );
	}

	handleChange( e ) {
		const { onChange = noop } = this.props;
		const change = calculateAlphaChange( e, this.props, this.container );
		if ( change ) {
			onChange( change, e );
		}
	}

	handleMouseDown( e ) {
		this.handleChange( e );
		window.addEventListener( 'mousemove', this.handleChange );
		window.addEventListener( 'mouseup', this.handleMouseUp );
	}

	handleMouseUp() {
		this.unbindEventListeners();
	}

	unbindEventListeners() {
		window.removeEventListener( 'mousemove', this.handleChange );
		window.removeEventListener( 'mouseup', this.handleMouseUp );
	}

	render() {
		const { rgb } = this.props;
		const rgbString = `${ rgb.r },${ rgb.g },${ rgb.b }`;
		const gradient = {
			background: `linear-gradient(to right, rgba(${ rgbString }, 0) 0%, rgba(${ rgbString }, 1) 100%)`,
		};

		const pointerLocation = { left: `${ rgb.a * 100 }%` };

		return (
			<div className="color-picker__alpha">
				<div
					className="color-picker__alpha-gradient"
					style={ gradient }
				/>
				{ /* eslint-disable jsx-a11y/no-static-element-interactions */ }
				<div
					className="color-picker__alpha-bar"
					ref={ ( container ) => ( this.container = container ) }
					onMouseDown={ this.handleMouseDown }
					onTouchMove={ this.handleChange }
					onTouchStart={ this.handleChange }>
					<button
						role="slider"
						aria-valuemax="1"
						aria-valuemin="0"
						aria-valuenow={ rgb.a }
						aria-orientation="horizontal"
						aria-label={ __(
							'Alpha value, from 0 (transparent) to 1 (fully opaque).'
						) }
						className="color-picker__alpha-pointer"
						style={ pointerLocation }
					/>
				</div>
				{ /* eslint-enable jsx-a11y/no-static-element-interactions */ }
			</div>
		);
	}
}

export default Alpha;
