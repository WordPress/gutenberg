/**
 * External dependencies
 */
import classnames from 'classnames';
import { pickBy, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import RangeControl from '../range-control';
import { createStyles } from './utils';
import { useControlledState } from '../utils/hooks';
import { interpolate } from '../utils/interpolate';
import { Root } from './styles/filter-control-styles';

const defaultFilters = {
	blur: true,
	brightness: true,
	contrast: true,
	grayscale: true,
	hue: true,
	invert: true,
	opacity: true,
	saturation: true,
	sepia: true,
};
function FilterControl(
	{ className, filters = defaultFilters, value, onChange = noop, ...props },
	ref
) {
	const [ controlledState, setControlledState ] = useControlledState( value );
	const filterOptions = { ...defaultFilters, ...filters };
	const state = controlledState || {};

	const classes = classnames( 'components-filter-control', className );

	const handleOnChange = ( next = {} ) => {
		const pickedState = pickBy( next, ( v ) => ! isNaN( v ) );
		const nextState = { ...state, ...pickedState };

		const styles = createStyles( nextState );

		onChange( nextState, { styles } );

		if ( ! value ) {
			setControlledState( nextState );
		}
	};

	return (
		<Root className={ classes } ref={ ref } { ...props }>
			{ filterOptions.blur && (
				<RangeControl
					label={ __( 'Blur' ) }
					trackColor="transparent"
					min={ 0 }
					max={ 100 }
					value={ state.blur }
					onChange={ ( next ) => {
						handleOnChange( { blur: next } );
					} }
				/>
			) }
			{ filterOptions.brightness && (
				<RangeControl
					label={ __( 'Brightness' ) }
					railColor="linear-gradient(to right, black, white)"
					trackColor="transparent"
					min={ -100 }
					max={ 100 }
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
			) }
			{ filterOptions.contrast && (
				<RangeControl
					label={ __( 'Contrast' ) }
					trackColor="transparent"
					min={ -100 }
					max={ 100 }
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
			) }
			{ filterOptions.grayscale && (
				<RangeControl
					label={ __( 'Grayscale' ) }
					trackColor="transparent"
					min={ 0 }
					max={ 100 }
					value={ state.grayscale }
					onChange={ ( next ) => {
						handleOnChange( { grayscale: next } );
					} }
				/>
			) }
			{ filterOptions.hue && (
				<RangeControl
					label={ __( 'Hue' ) }
					railColor="linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)"
					trackColor="transparent"
					min={ -180 }
					max={ 180 }
					value={ state[ 'hue-rotate' ] }
					onChange={ ( next ) => {
						handleOnChange( { 'hue-rotate': next } );
					} }
				/>
			) }
			{ filterOptions.invert && (
				<RangeControl
					label={ __( 'Invert' ) }
					trackColor="transparent"
					min={ 0 }
					max={ 100 }
					value={ state.invert }
					onChange={ ( next ) => {
						handleOnChange( { invert: next } );
					} }
				/>
			) }
			{ filterOptions.opacity && (
				<RangeControl
					label={ __( 'Opacity' ) }
					trackColor="transparent"
					min={ 0 }
					max={ 100 }
					value={ state.opacity }
					onChange={ ( next ) => {
						handleOnChange( { opacity: next } );
					} }
				/>
			) }
			{ filterOptions.saturation && (
				<RangeControl
					label={ __( 'Saturation' ) }
					railColor="linear-gradient(to right, #aaa, red)"
					trackColor="transparent"
					min={ -100 }
					max={ 100 }
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
			) }
			{ filterOptions.sepia && (
				<RangeControl
					label={ __( 'Sepia' ) }
					trackColor="transparent"
					min={ 0 }
					max={ 100 }
					value={ state.sepia }
					onChange={ ( next ) => {
						handleOnChange( {
							sepia: next,
						} );
					} }
				/>
			) }
		</Root>
	);
}

function interpolateValue( value, inputRange, outputRange ) {
	if ( value === undefined || value === null ) {
		return null;
	}

	return Math.round( interpolate( value, inputRange, outputRange ) );
}

const ForwardedComponent = forwardRef( FilterControl );
ForwardedComponent.createStyles = createStyles;

export default ForwardedComponent;
