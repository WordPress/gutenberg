/**
 * WordPress dependencies
 */
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { MarkProps, useMarksDataArgs } from '../types';

const useMarksData = ( {
	marks,
	min = 0,
	max = 100,
	step = 1,
	value = 0,
}: useMarksDataArgs ) => {
	if ( ! marks || step === 0 ) {
		return [];
	}

	const range = max - min;
	if ( ! Array.isArray( marks ) ) {
		marks = [];
		const count = 1 + Math.round( range / step );
		while ( count > marks.push( { value: step * marks.length + min } ) );
	}

	const placedMarks: MarkProps[] = [];
	marks.forEach( ( mark, index ) => {
		if ( mark.value < min || mark.value > max ) {
			return;
		}
		const key = `mark-${ index }`;
		const isFilled = mark.value <= value;
		const offset = `${ ( ( mark.value - min ) / range ) * 100 }%`;

		const offsetStyle = {
			[ isRTL() ? 'right' : 'left' ]: offset,
		};

		placedMarks.push( {
			...mark,
			isFilled,
			key,
			style: offsetStyle,
		} );
	} );

	return placedMarks;
};

export default useMarksData;
