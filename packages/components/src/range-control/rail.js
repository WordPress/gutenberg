// @ts-nocheck
/**
 * WordPress dependencies
 */
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import RangeMark from './mark';
import { MarksWrapper, Rail } from './styles/range-control-styles';

export default function RangeRail( {
	disabled = false,
	marks = false,
	min = 0,
	max = 100,
	step = 1,
	value = 0,
	...restProps
} ) {
	return (
		<>
			<Rail disabled={ disabled } { ...restProps } />
			{ marks && (
				<Marks
					disabled={ disabled }
					marks={ marks }
					min={ min }
					max={ max }
					step={ step }
					value={ value }
				/>
			) }
		</>
	);
}

function Marks( {
	disabled = false,
	marks = false,
	min = 0,
	max = 100,
	step = 1,
	value = 0,
} ) {
	if ( step === 'any' ) {
		step = 1;
	}
	const marksData = useMarks( { marks, min, max, step, value } );

	return (
		<MarksWrapper
			aria-hidden="true"
			className="components-range-control__marks"
		>
			{ marksData.map( ( mark ) => (
				<RangeMark
					{ ...mark }
					key={ mark.key }
					aria-hidden="true"
					disabled={ disabled }
				/>
			) ) }
		</MarksWrapper>
	);
}

function useMarks( { marks, min = 0, max = 100, step = 1, value = 0 } ) {
	if ( ! marks ) {
		return [];
	}

	const range = max - min;
	if ( ! Array.isArray( marks ) ) {
		marks = [];
		const count = 1 + Math.round( range / step );
		while ( count > marks.push( { value: step * marks.length + min } ) );
	}

	const placedMarks = [];
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
}
