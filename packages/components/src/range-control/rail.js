/**
 * External dependencies
 */
import { isUndefined } from 'lodash';
/**
 * Internal dependencies
 */
import RangeMark from './mark';
import { Rail } from './styles/range-control-styles';

export default function RangeRail( {
	marks = false,
	min = 0,
	max = 100,
	step = 1,
	value = 0,
	...restProps
} ) {
	const marksData = useMarks( { marks, min, max, step, value } );

	return (
		<Rail { ...restProps }>
			{ marks && (
				<>
					{ marksData.map( ( mark ) => (
						<RangeMark { ...mark } key={ mark.key } aria-hidden="true" />
					) ) }
				</>
			) }
		</Rail>
	);
}

function useMarks( { marks, min = 0, max = 100, step = 1, value = 0 } ) {
	const isCustomMarks = Array.isArray( marks );

	const markCount = ( max - min ) / step;
	const marksArray = isCustomMarks ? marks :
		[ ...Array( markCount + 1 ) ]
			.map( ( _, index ) => ( { value: index } ) );

	const enhancedMarks = marksArray.map( ( mark, index ) => {
		const markValue = ! isUndefined( mark.value ) ? mark.value : value;

		const key = `mark-${ index }`;
		const isFilled = markValue <= value;
		const left = `${ ( markValue / markCount ) * 100 }%`;

		return {
			...mark,
			left,
			isFilled,
			key,
		};
	} );

	return enhancedMarks;
}
