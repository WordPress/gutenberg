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
	const isRTL = document.documentElement.dir === 'rtl';

	if ( ! marks ) {
		return [];
	}

	const isCustomMarks = Array.isArray( marks );

	const markCount = Math.round( ( max - min ) / step );
	const marksArray = isCustomMarks
		? marks
		: [ ...Array( markCount + 1 ) ].map( ( _, index ) => ( {
				value: index,
		  } ) );

	const enhancedMarks = marksArray.map( ( mark, index ) => {
		const markValue = mark.value !== undefined ? mark.value : value;

		const key = `mark-${ index }`;
		const isFilled = markValue * step + min <= value;
		const offset = `${ ( markValue / markCount ) * 100 }%`;

		const offsetStyle = {
			[ isRTL ? 'right' : 'left' ]: offset,
		};

		return {
			...mark,
			isFilled,
			key,
			style: offsetStyle,
		};
	} );

	return enhancedMarks;
}
