/**
 * External dependencies
 */
import { css, cx } from 'emotion';

/**
 * Internal dependencies
 */
import { useContextSystem } from '../context';
import { useControlGroupContext } from '../control-group';
import { useFlex } from '../flex';
import * as styles from './styles';

/**
 * @type {('onMouseDown' | 'onClick')[]}
 */
const disabledEventsOnDisabledButton = [ 'onMouseDown', 'onClick' ];

/**
 * @param {import('../context').ViewOwnProps<import('./types').Props, 'button'>} props
 */
export function useBaseButton( props ) {
	const {
		children,
		className,
		currentColor,
		disabled = false,
		elevation = 0,
		elevationActive,
		elevationFocus,
		elevationHover,
		gap = 2,
		hasCaret = false,
		href,
		icon,
		iconSize = 16,
		isBlock = false,
		isControl = false,
		isDestructive = false,
		isFocusable = true,
		isLoading = false,
		isNarrow = false,
		isRounded = false,
		isSplit = false,
		isSubtle = false,
		justify = 'center',
		noWrap = true,
		pre,
		size = 'medium',
		suffix,
		textAlign = 'center',
		...otherProps
	} = useContextSystem( props, 'BaseButton' );

	const { className: flexClassName, ...flexProps } = useFlex( {
		gap,
		justify,
	} );

	/** @type {import('react').ElementType} */
	const as = href ? 'a' : 'button';
	const { styles: controlGroupStyles } = useControlGroupContext();
	const isIconOnly = !! icon && ! children;

	const classes = cx(
		flexClassName,
		styles.Button,
		isBlock && styles.block,
		isDestructive && styles.destructive,
		styles[ size ],
		isIconOnly && styles.icon,
		isSubtle && styles.subtle,
		isControl && styles.control,
		isSubtle && isControl && styles.subtleControl,
		controlGroupStyles,
		isRounded && styles.rounded,
		isNarrow && styles.narrow,
		isSplit && styles.split,
		currentColor && styles.currentColor,
		css( { textAlign } ),
		className
	);

	const trulyDisabled = disabled && ! isFocusable;

	const returnProps = {
		...flexProps,
		as,
		href,
		children,
		disabled: trulyDisabled,
		elevation,
		className: classes,
		elevationActive,
		elevationFocus,
		elevationHover,
		hasCaret,
		icon,
		isDestructive,
		pre,
		suffix,
		iconSize,
		isLoading,
		noWrap,
		...otherProps,
	};

	if ( disabled && isFocusable ) {
		// In this case, the button will be disabled, but still focusable and
		// perceivable by screen reader users.
		returnProps[ 'aria-disabled' ] = true;

		for ( const disabledEvent of disabledEventsOnDisabledButton ) {
			returnProps[ disabledEvent ] = (
				/** @type {import('react').MouseEvent<any>} */ event
			) => {
				event.stopPropagation();
				event.preventDefault();
			};
		}
	}

	return returnProps;
}
