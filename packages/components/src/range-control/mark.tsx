/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import { Mark, MarkLabel } from './styles/range-control-styles';

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
		isFilled && 'is-filled',
		className
	);
	const labelClasses = clsx(
		'components-range-control__mark-label',
		isFilled && 'is-filled'
	);

	return (
		<>
			<Mark
				{ ...otherProps }
				aria-hidden="true"
				className={ classes }
				isFilled={ isFilled }
				style={ style }
			/>
			{ label && (
				<MarkLabel
					aria-hidden="true"
					className={ labelClasses }
					isFilled={ isFilled }
					style={ style }
				>
					{ label }
				</MarkLabel>
			) }
		</>
	);
}
