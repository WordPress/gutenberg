/**
 * External dependencies
 */
import { clamp, noop, throttle } from 'lodash';
import Mousetrap from 'mousetrap';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { withInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { calculateSaturationChange } from './utils';

export class Saturation extends Component {
	constructor( props ) {
		super( props );

		this.throttle = throttle( ( fn, data, e ) => {
			fn( data, e );
		}, 50 );

		this.saturate = this.saturate.bind( this );
		this.brighten = this.brighten.bind( this );
		this.handleChange = this.handleChange.bind( this );
		this.handleMouseDown = this.handleMouseDown.bind( this );
		this.handleMouseUp = this.handleMouseUp.bind( this );
	}

	componentDidMount() {
		this.mousetrap = new Mousetrap( this.container );
		this.mousetrap.bind( 'up', () => this.brighten() );
		this.mousetrap.bind( 'shift+up', () => this.brighten( 0.1 ) );
		this.mousetrap.bind( 'pageup', () => this.brighten( 1 ) );
		this.mousetrap.bind( 'down', () => this.brighten( -0.01 ) );
		this.mousetrap.bind( 'shift+down', () => this.brighten( -0.1 ) );
		this.mousetrap.bind( 'pagedown', () => this.brighten( -1 ) );

		this.mousetrap.bind( 'right', () => this.saturate() );
		this.mousetrap.bind( 'shift+right', () => this.saturate( 0.1 ) );
		this.mousetrap.bind( 'end', () => this.saturate( 1 ) );
		this.mousetrap.bind( 'left', () => this.saturate( -0.01 ) );
		this.mousetrap.bind( 'shift+left', () => this.saturate( -0.1 ) );
		this.mousetrap.bind( 'home', () => this.saturate( -1 ) );
	}

	componentWillUnmount() {
		this.throttle.cancel();
		this.unbindEventListeners();
		this.mousetrap.reset();
	}

	saturate( amount = 0.01 ) {
		const { hsv, onChange = noop } = this.props;
		const intSaturation = clamp(
			Math.round( hsv.s * 100 ) + Math.round( amount * 100 ),
			0,
			100
		);
		const change = {
			h: hsv.h,
			s: intSaturation / 100,
			v: hsv.v,
			a: hsv.a,
			source: 'rgb',
		};

		onChange( change );
	}

	brighten( amount = 0.01 ) {
		const { hsv, onChange = noop } = this.props;
		const intValue = clamp(
			Math.round( hsv.v * 100 ) + Math.round( amount * 100 ),
			0,
			100
		);
		const change = {
			h: hsv.h,
			s: hsv.s,
			v: intValue / 100,
			a: hsv.a,
			source: 'rgb',
		};

		onChange( change );
	}

	handleChange( e ) {
		const { onChange = noop } = this.props;
		const change = calculateSaturationChange( e, this.props, this.container );
		this.throttle( onChange, change, e );
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
		const { hsv, hsl, instanceId } = this.props;
		const pointerLocation = {
			top: `${ -( hsv.v * 100 ) + 100 }%`,
			left: `${ hsv.s * 100 }%`,
		};

		/* eslint-disable jsx-a11y/no-static-element-interactions */
		return (
			<div
				style={ { background: `hsl(${ hsl.h },100%, 50%)` } }
				className="components-color-picker__saturation-color"
				ref={ ( container ) => ( this.container = container ) }
				onMouseDown={ this.handleMouseDown }
				onTouchMove={ this.handleChange }
				onTouchStart={ this.handleChange }>
				<div className="components-color-picker__saturation-white" />
				<div className="components-color-picker__saturation-black" />
				<button
					aria-label={ __( 'Saturation & lightness value' ) }
					aria-describedby={ `color-picker-saturation-${ instanceId }` }
					className="components-color-picker__saturation-pointer"
					style={ pointerLocation }
				/>
				<div
					className="screen-reader-text"
					id={ `color-picker-saturation-${ instanceId }` }>
					{ __(
						'Use your arrow keys to change the base color. Move up to lighten the color, down to darken, left to increase saturation, and right to decrease saturation.'
					) }
				</div>
			</div>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions */
	}
}

export default withInstanceId( Saturation );
