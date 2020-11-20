/**
 * External dependencies
 */
import { Dimensions } from 'react-native';

/**
 * WordPress dependencies
 */
import {
	useContext,
	useEffect,
	useState,
	useMemo,
	useCallback,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import GlobalStylesContext from '../global-styles-context';

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

const useConvertUnitToMobile = ( value, unit ) => {
	const [ windowSizes, setWindowSizes ] = useState(
		Dimensions.get( 'window' )
	);

	useEffect( () => {
		Dimensions.addEventListener( 'change', onDimensionsChange );

		return () => {
			Dimensions.removeEventListener( 'change', onDimensionsChange );
		};
	}, [] );
	const { globalStyles: styles } = useContext( GlobalStylesContext );

	const onDimensionsChange = useCallback( ( { window } ) => {
		setWindowSizes( window );
	}, [] );

	return useMemo( () => {
		const { width, height } = windowSizes;
		const { fontSize = 16 } = styles || {};

		const { valueToConvert, valueUnit } = getValueAndUnit( value, unit );

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
	}, [ windowSizes, value, unit ] );
};

export { useConvertUnitToMobile, getValueAndUnit };
