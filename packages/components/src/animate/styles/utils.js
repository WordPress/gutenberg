/**
 * Internal dependencies
 */
import { getRTL } from '../../utils';

export const getRTLSafeTranslateX = ( { origin } ) => {
	const isRTL = getRTL();

	if ( isRTL ) {
		return origin === 'right' ? '-100%' : '+100%';
	}

	return origin === 'right' ? '+100%' : '-100%';
};

export const getRTLSafeXAxis = ( { xAxis } ) => {
	const isRTL = getRTL();

	if ( isRTL ) {
		switch ( xAxis ) {
			case 'left':
				return 'right';
			case 'right':
				return 'left';
			default:
				return xAxis;
		}
	}

	return xAxis;
};
