import clsx from 'clsx';
import { PolymorphicElement } from '../utils/polymorphic-element';
import styles from './style.module.scss';
import type { RangeMarkProps } from './types';
import type { WordPressComponentProps } from '../context';

export default function RangeMark(
	props: WordPressComponentProps< RangeMarkProps, 'span' >
) {
	const {
		className,
		isFilled = false,
		label,
		style = {},
		...otherProps
	} = props;

	const classes = clsx(
		'components-range-control__mark',
		styles.mark,
		isFilled && 'is-filled',
		className
	);
	const labelClasses = clsx(
		'components-range-control__mark-label',
		styles[ 'mark-label' ],
		{ [ styles[ 'is-filled' ] ]: isFilled },
		isFilled && 'is-filled'
	);

	return (
		<>
			<PolymorphicElement
				as="span"
				{ ...otherProps }
				aria-hidden="true"
				className={ classes }
				style={ style }
			/>
			{ label && (
				<span
					aria-hidden="true"
					className={ labelClasses }
					style={ style }
				>
					{ label }
				</span>
			) }
		</>
	);
}
