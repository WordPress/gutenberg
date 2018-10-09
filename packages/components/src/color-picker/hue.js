/**
 * External dependencies
 */
import Mousetrap from 'mousetrap';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { calculateHueChange } from './utils';

export class Hue extends Component {
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
		this.mousetrap.bind( 'shift+up', () => this.increase( 10 ) );
		this.mousetrap.bind( 'shift+right', () => this.increase( 10 ) );
		this.mousetrap.bind( 'pageup', () => this.increase( 10 ) );
		this.mousetrap.bind( 'end', () => this.increase( 359 ) );
		this.mousetrap.bind( 'down', () => this.decrease() );
		this.mousetrap.bind( 'left', () => this.decrease() );
		this.mousetrap.bind( 'shift+down', () => this.decrease( 10 ) );
		this.mousetrap.bind( 'shift+left', () => this.decrease( 10 ) );
		this.mousetrap.bind( 'pagedown', () => this.decrease( 10 ) );
		this.mousetrap.bind( 'home', () => this.decrease( 359 ) );
	}

	componentWillUnmount() {
		this.unbindEventListeners();
		this.mousetrap.reset();
	}

	increase( amount = 1 ) {
		const { hsl, onChange = noop } = this.props;
		const change = {
			h: hsl.h + amount >= 359 ? 359 : hsl.h + amount,
			s: hsl.s,
			l: hsl.l,
			a: hsl.a,
			source: 'rgb',
		};
		onChange( change );
	}

	decrease( amount = 1 ) {
		const { hsl, onChange = noop } = this.props;
		const change = {
			h: hsl.h <= amount ? 0 : hsl.h - amount,
			s: hsl.s,
			l: hsl.l,
			a: hsl.a,
			source: 'rgb',
		};
		onChange( change );
	}

	handleChange( e ) {
		const { onChange = noop } = this.props;
		const change = calculateHueChange( e, this.props, this.container );
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
		const { hsl = {} } = this.props;

		const pointerLocation = { left: `${ ( hsl.h * 100 ) / 360 }%` };

		return (
			<div className="color-picker__hue">
				<div className="color-picker__hue-gradient" />
				<div
					className="color-picker__hue-bar"
					ref={ ( container ) => ( this.container = container ) }
					onMouseDown={ this.handleMouseDown }
					onTouchMove={ this.handleChange }
					onTouchStart={ this.handleChange }>
					<div
						tabIndex="0"
						role="slider"
						aria-valuemax="1"
						aria-valuemin="359"
						aria-valuenow={ hsl.h }
						aria-orientation="horizontal"
						aria-label="Hue value in degrees, from 0 to 359."
						className="color-picker__hue-pointer"
						style={ pointerLocation }>
						<div className="color-picker__hue-slider" />
					</div>
				</div>
			</div>
		);
	}
}

export default Hue;
