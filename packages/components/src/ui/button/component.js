/**
 * External dependencies
 */
import { contextConnect, useContextSystem } from '@wp-g2/context';
import { cx } from '@wp-g2/styles';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { BaseButton } from '../base-button';
import { useButtonGroupContext } from '../button-group';
import * as styles from './styles';

/**
 * @typedef {'primary' | 'secondary' | 'tertiary' | 'plain' | 'link'} ButtonVariant
 */

/**
 * @typedef OwnProps
 * @property {ButtonVariant} [variant='secondary'] Determinds the `Button` variant to render.
 */

/**
 * @typedef {import('../base-button/types').Props & OwnProps} Props
 */

/**
 * @param {import('@wp-g2/create-styles').ViewOwnProps<Props, 'button'>} props
 * @param {import('react').Ref<any>} forwardedRef
 */
function Button( props, forwardedRef ) {
	const {
		children,
		className,
		currentColor,
		icon,
		isActive: isActiveProp = false,
		isControl = false,
		isSubtle = false,
		onClick = noop,
		size = 'medium',
		variant = 'secondary',
		...otherProps
	} = useContextSystem( props, 'Button' );

	const { buttonGroup, enableSelectNone } = useButtonGroupContext();
	const isWithinButtonGroup = !! buttonGroup;
	const isButtonGroupActive =
		isWithinButtonGroup && buttonGroup?.state === otherProps.value;

	const isActive = isActiveProp || isButtonGroupActive;
	const isIconOnly = !! icon && ! children;

	const handleOnClickWithinButtonGroup = useCallback(
		( event ) => {
			if (
				isWithinButtonGroup &&
				enableSelectNone &&
				isButtonGroupActive &&
				buttonGroup
			) {
				event.preventDefault();
				event.stopPropagation();
				buttonGroup.setState( undefined );
			}
		},
		[
			buttonGroup,
			enableSelectNone,
			isButtonGroupActive,
			isWithinButtonGroup,
		]
	);

	const handleOnClick = useCallback(
		( event ) => {
			onClick( event );
			handleOnClickWithinButtonGroup( event );
		},
		[ handleOnClickWithinButtonGroup, onClick ]
	);

	const classes = cx(
		styles.Button,
		styles[ variant ],
		styles[ size ],
		isControl && styles.control,
		isSubtle && styles.subtle,
		isSubtle && isControl && styles.subtleControl,
		isButtonGroupActive && styles.subtleControlActive,
		isIconOnly && styles.icon,
		currentColor && styles.currentColor,
		className
	);

	return (
		<BaseButton
			className={ classes }
			icon={ icon }
			isActive={ isActive }
			onClick={ handleOnClick }
			ref={ forwardedRef }
			{ ...otherProps }
		>
			{ children }
		</BaseButton>
	);
}

/**
 * `Button` is a component used to trigger an action or event, such as submitting a Form, opening a Dialog, canceling an action, or performing a delete operation.
 *
 * @example
 * ```jsx
 * import { Button } from `@wordpress/components/ui`;
 *
 * function Example() {
 *   return <Button variant="secondary">Code is Poetry</Button>;
 * }
 * ```
 */
const ConnectedButton = contextConnect( Button, 'Button' );

export default ConnectedButton;
