/**
 * Internal dependencies
 */
import { Mark, Rail } from './styles/range-control-styles';

export default function RangeRail( {
	marks = false,
	min = 0,
	max = 100,
	step = 1,
	value = 0,
} ) {
	const marksData = useMarks( { min, max, step, value } );
	const LastMark = Mark;

	return (
		<Rail>
			{ marks && (
				<>
					{ marksData.map( ( mark ) => (
						<Mark { ...mark } key={ mark.key } aria-hidden="true" />
					) ) }
					<LastMark style={ { left: '100%' } } />
				</>
			) }
		</Rail>
	);
}

function useMarks( { min = 0, max = 100, step = 1, value = 0 } ) {
	const markCount = ( max - min ) / step;

	const marks = [ ...Array( markCount ) ].map( ( _, index ) => {
		const key = `mark-${ index }`;
		const isFilled = value >= index;
		const style = {
			left: `${ index / markCount * 100 }%`,
			background: isFilled ? 'currentColor' : undefined,
		};

		return {
			key,
			style,
		};
	} );

	return marks;
}
