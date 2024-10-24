/**
 * External dependencies
 */
import { Dimensions } from 'react-native';

/**
 * WordPress dependencies
 */
import { useEffect, useState, useMemo, useCallback } from '@wordpress/element';

const getValueAndUnit = ( value, unit ) => {
	const regex = /(\d+\.?\d*)(.*)/;

	const splitValue = `${ value }`
		?.match( regex )
		?.filter( ( v ) => v !== '' );

	if ( splitValue ) {
		return {
			valueToConvert: splitValue[ 1 ],
			valueUnit: unit || splitValue[ 2 ],
		};
	}
	return undefined;
};

const convertUnitToMobile = ( containerSize, globalStyles, value, unit ) => {
	const { width, height } = containerSize;
	const { valueToConvert, valueUnit } = getValueAndUnit( value, unit ) || {};
	const { fontSize = 16 } = globalStyles || {};

	if ( valueToConvert === undefined ) {
		return undefined;
	}

	switch ( valueUnit ) {
		case 'rem':
		case 'em':
			return valueToConvert * fontSize;
		case '%':
			return Number( valueToConvert / 100 ) * width;
		case 'px':
			return Number( valueToConvert );
		case 'vw':
			const vw = width / 100;
			return Math.round( valueToConvert * vw );
		case 'vh':
			const vh = height / 100;
			return Math.round( valueToConvert * vh );
		default:
			return Number( valueToConvert / 100 ) * width;
	}
};

const useConvertUnitToMobile = ( value, unit, styles ) => {
	const [ windowSizes, setWindowSizes ] = useState(
		Dimensions.get( 'window' )
	);

	useEffect( () => {
		const dimensionsChangeSubscription = Dimensions.addEventListener(
			'change',
			onDimensionsChange
		);

		return () => {
			dimensionsChangeSubscription.remove();
		};
		// See https://github.com/WordPress/gutenberg/pull/41166
	}, [] );

	const onDimensionsChange = useCallback( ( { window } ) => {
		setWindowSizes( window );
	}, [] );

	return useMemo( () => {
		const { valueToConvert, valueUnit } =
			getValueAndUnit( value, unit ) || {};

		return convertUnitToMobile(
			windowSizes,
			styles,
			valueToConvert,
			valueUnit
		);
		// See https://github.com/WordPress/gutenberg/pull/41166
	}, [ windowSizes, value, unit ] );
};

export { convertUnitToMobile, useConvertUnitToMobile, getValueAndUnit };
