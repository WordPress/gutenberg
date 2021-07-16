/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { usePopoverState } from 'reakit';

/**
 * Internal dependencies
 */
import { useContextSystem } from '../../ui/context';

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
		state,
		visible,
		...otherProps
	} = useContextSystem( props, 'Flyout' );

	const _flyoutState = usePopoverState( {
		animated: animated ? animationDuration : undefined,
		baseId: baseId || id,
		placement,
		visible,
		...otherProps,
	} );

	const flyoutState = state || _flyoutState;

	return {
		...otherProps,
		elevation,
		maxWidth,
		flyoutState,
	};
}
