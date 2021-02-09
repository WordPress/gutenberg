/**
 * External dependencies
 */
import { cx } from '@wp-g2/styles';

/**
 *
 * @param {import('@wp-g2/create-styles').ViewOwnProps<{}, 'div'>} props
 */
export function useVisuallyHidden( {
	className,
	style: propStyles,
	...props
} ) {
	// circumvent the context system and write the classnames ourselves
	const classes = cx(
		'components-visually-hidden wp-components-visually-hidden',
		className
	);
	/** @type {import('react').CSSProperties} */
	const style = {
		border: 0,
		clip: 'rect(0 0 0 0)',
		height: '1px',
		margin: '-1px',
		overflow: 'hidden',
		padding: 0,
		position: 'absolute',
		whiteSpace: 'nowrap',
		width: '1px',
		...propStyles,
	};

	return {
		className: classes,
		style,
		...props,
	};
}
