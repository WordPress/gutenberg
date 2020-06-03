/**
 * External dependencies
 */
import { pickBy, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { forwardRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import RangeControl from '../range-control';
import { createStyles } from './utils';
import { interpolate } from '../utils/interpolate';

function FilterControl( { value = {}, onChange = noop }, ref ) {
	const [ state, setState ] = useState( value );

	const handleOnChange = ( next = {} ) => {
		const pickedState = pickBy( next, ( v ) => ! isNaN( v ) );
		const nextState = { ...state, ...pickedState };

		const styles = createStyles( nextState );

		onChange( nextState, { styles } );
		setState( nextState );
	};

	return (
		<div ref={ ref }>
			<RangeControl
				label="Blur"
				trackColor="transparent"
				min={ 0 }
				max={ 100 }
				step={ 1 }
				value={ state.blur }
				onChange={ ( next ) => {
					handleOnChange( { blur: next } );
				} }
			/>
			<RangeControl
				label="Brightness"
				railColor="linear-gradient(to right, black, white)"
				trackColor="transparent"
				min={ -100 }
				max={ 100 }
				step={ 1 }
				value={ interpolateValue(
					state.brightness,
					[ 0, 200 ],
					[ -100, 100 ]
				) }
				onChange={ ( next ) => {
					handleOnChange( {
						brightness: interpolateValue(
							next,
							[ -100, 100 ],
							[ 0, 200 ]
						),
					} );
				} }
			/>
			<RangeControl
				label="Contrast"
				trackColor="transparent"
				min={ -100 }
				max={ 100 }
				step={ 1 }
				value={ interpolateValue(
					state.contrast,
					[ 0, 200 ],
					[ -100, 100 ]
				) }
				onChange={ ( next ) => {
					handleOnChange( {
						contrast: interpolateValue(
							next,
							[ -100, 100 ],
							[ 0, 200 ]
						),
					} );
				} }
			/>
			<RangeControl
				label="Hue"
				railColor="linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)"
				trackColor="transparent"
				min={ -180 }
				max={ 180 }
				step={ 1 }
				value={ state[ 'hue-rotate' ] }
				onChange={ ( next ) => {
					handleOnChange( { 'hue-rotate': next } );
				} }
			/>
			<RangeControl
				label="Saturation"
				railColor="linear-gradient(to right, #aaa, red)"
				trackColor="transparent"
				min={ -100 }
				max={ 100 }
				step={ 1 }
				value={ interpolateValue(
					state.saturate,
					[ 0, 200 ],
					[ -100, 100 ]
				) }
				onChange={ ( next ) => {
					handleOnChange( {
						saturate: interpolateValue(
							next,
							[ -100, 100 ],
							[ 0, 200 ]
						),
					} );
				} }
			/>
			<RangeControl
				label="Sepia"
				trackColor="transparent"
				min={ 0 }
				max={ 100 }
				step={ 1 }
				value={ state.sepia }
				onChange={ ( next ) => {
					handleOnChange( {
						sepia: next,
					} );
				} }
			/>
		</div>
	);
}

function interpolateValue( value, inputRange, outputRange ) {
	if ( value === undefined || value === null ) {
		return null;
	}

	return interpolate( value, inputRange, outputRange );
}

const ForwardedComponent = forwardRef( FilterControl );
ForwardedComponent.createStyles = createStyles;

export default ForwardedComponent;
