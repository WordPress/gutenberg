/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { PopoverDisclosure, Portal } from 'reakit';

/**
 * Internal dependencies
 */
import Button from '../../button';
import { contextConnect } from '../../ui/context';
import { FlyoutContext } from '../context';
import { useFlyoutResizeUpdater } from '../utils';
import FlyoutContent from '../flyout-content';
import { useFlyout } from './hook';

/**
 * @param {import('../../ui/context').PolymorphicComponentProps<import('../types').Props, 'div', false>} props
 * @param {import('react').Ref<any>}                                                                     forwardedRef
 */
function Flyout( props, forwardedRef ) {
	const {
		children,
		elevation,
		maxWidth,
		flyoutState,
		...otherProps
	} = useFlyout( props );

	const resizeListener = useFlyoutResizeUpdater( {
		onResize: flyoutState.unstable_update,
	} );

	const buttonId = `${ flyoutState.baseId }-button`;

	return (
		<FlyoutContext.Provider value={ flyoutState }>
			<PopoverDisclosure
				id={ buttonId }
				as={ Button }
				state={ flyoutState }
				{ ...otherProps }
			/>
			<Portal>
				<FlyoutContent
					ref={ forwardedRef }
					elevation={ elevation }
					maxWidth={ maxWidth }
					aria-labelledby={ buttonId }
				>
					{ resizeListener }
					{ children }
				</FlyoutContent>
			</Portal>
		</FlyoutContext.Provider>
	);
}

/**
 * `Flyout` is a component to render a floating content modal.
 * It is similar in purpose to a tooltip, but renders content of any sort,
 * not only simple text.
 *
 * @example
 * ```jsx
 * import {
 *   __experimentalFlyout as Flyout,
 *   __experimentalText as Text,
 * } from '@wordpress/components';
 *
 * function Example() {
 * 	return (
 * 		<Flyout text="Show/Hide content">
 *			<Text>Code is Poetry</Text>
 * 		</Flyout>
 * 	);
 * }
 * ```
 */
const ConnectedFlyout = contextConnect( Flyout, 'Flyout' );

export default ConnectedFlyout;
