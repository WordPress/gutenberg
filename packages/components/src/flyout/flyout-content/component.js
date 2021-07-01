/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { Popover as ReakitPopover } from 'reakit';

/**
 * Internal dependencies
 */
import { useFlyoutContext } from '../context';
import { FlyoutContentView, CardView } from '../styles';
import { contextConnect, useContextSystem } from '../../ui/context';

/**
 *
 * @param {import('../../ui/context').PolymorphicComponentProps<import('../types').ContentProps, 'div'>} props
 * @param {import('react').Ref<any>}                                                                     forwardedRef
 */
function FlyoutContent( props, forwardedRef ) {
	const { children, elevation, ...otherProps } = useContextSystem(
		props,
		'FlyoutContent'
	);

	const { label, flyoutState } = useFlyoutContext();

	if ( ! flyoutState ) {
		throw new Error(
			'`FlyoutContent` must only be used inside a `Flyout`.'
		);
	}

	const showContent = flyoutState.visible || flyoutState.animating;

	return (
		<FlyoutContentView
			aria-label={ label }
			as={ ReakitPopover }
			{ ...otherProps }
			{ ...flyoutState }
		>
			{ showContent && (
				<CardView elevation={ elevation } ref={ forwardedRef }>
					{ children }
				</CardView>
			) }
		</FlyoutContentView>
	);
}

const ConnectedFlyoutContent = contextConnect( FlyoutContent, 'FlyoutContent' );

export default ConnectedFlyoutContent;
