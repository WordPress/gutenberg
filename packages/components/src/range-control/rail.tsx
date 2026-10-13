import { isRTL } from '@wordpress/i18n';
import clsx from 'clsx';
import { useCx } from '../utils/hooks';
import { railBackgroundColor } from './styles';
import RangeMark from './mark';
import { PolymorphicElement } from '../utils/polymorphic-element';
import styles from './style.module.scss';
import type { WordPressComponentProps } from '../context';
import type {
	MarksProps,
	RangeMarkProps,
	RailProps,
	UseMarksArgs,
} from './types';

export default function RangeRail(
	props: WordPressComponentProps< RailProps, 'span' >
) {
	const {
		disabled = false,
		marks = false,
		min = 0,
		max = 100,
		step = 1,
		value = 0,
		railColor,
		className,
		style,
		...restProps
	} = props;

	const cx = useCx();

	return (
		<>
			<PolymorphicElement
				as="span"
				{ ...restProps }
				{ ...{ disabled } }
				className={ cx(
					styles.rail,
					className,
					railBackgroundColor( { disabled, railColor } )
				) }
				style={ style }
			/>
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

function Marks( props: WordPressComponentProps< MarksProps, 'span' > ) {
	const {
		disabled = false,
		marks = false,
		min = 0,
		max = 100,
		step: stepProp = 1,
		value = 0,
	} = props;

	const step = stepProp === 'any' ? 1 : stepProp;
	const marksData = useMarks( { marks, min, max, step, value } );

	return (
		<span
			aria-hidden="true"
			className={ clsx(
				'components-range-control__marks',
				styles.marks
			) }
		>
			{ marksData.map( ( mark ) => (
				<RangeMark
					{ ...mark }
					key={ mark.key }
					aria-hidden="true"
					disabled={ disabled }
				/>
			) ) }
		</span>
	);
}

function useMarks( {
	marks,
	min = 0,
	max = 100,
	step = 1,
	value = 0,
}: UseMarksArgs ) {
	if ( ! marks ) {
		return [];
	}

	const range = max - min;
	if ( ! Array.isArray( marks ) ) {
		marks = [];
		const count = 1 + Math.round( range / step );
		while ( count > marks.push( { value: step * marks.length + min } ) ) {}
	}

	const placedMarks: RangeMarkProps[] = [];
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
