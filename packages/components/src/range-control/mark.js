/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { Mark, MarkLabel } from './styles/range-control-styles';

export default function RangeMark( {
	className,
	isFilled = false,
	label,
	style = {},
	...props
} ) {
	const classes = classnames(
		'components-range-control__mark',
		isFilled && 'is-filled',
		className
	);
	const labelClasses = classnames(
		'components-range-control__mark-label',
		isFilled && 'is-filled'
	);

	return (
		<>
			<Mark
				{ ...props }
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
