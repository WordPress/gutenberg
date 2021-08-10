/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { usePopoverState } from 'reakit';

/**
 * Internal dependencies
 */
import { useContextSystem } from '../../ui/context';
import { useUpdateEffect } from '../../utils';

/**
 * @param {import('../../ui/context').PolymorphicComponentProps<import('../types').Props, 'div', false>} props
 */
export function useFlyout( props ) {
	const {
		animated = true,
		animationDuration = 160,
		baseId,
		elevation = 5,
		id,
		maxWidth = 360,
		placement,
		onToggle,
		isOpen,
		...otherProps
	} = useContextSystem( props, 'Flyout' );

	const _flyoutState = usePopoverState( {
		animated: animated ? animationDuration : undefined,
		baseId: baseId || id,
		placement,
		visible: isOpen,
		...otherProps,
	} );

	const flyoutState = {
		..._flyoutState,
		visible: isOpen ?? _flyoutState.visible,
	};

	useUpdateEffect( () => {
		onToggle?.( _flyoutState.visible );
	}, [ _flyoutState.visible ] );

	return {
		...otherProps,
		elevation,
		maxWidth,
		flyoutState,
	};
}
