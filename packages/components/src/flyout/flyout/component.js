/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { PopoverDisclosure, Portal } from 'reakit';

/**
 * WordPress dependencies
 */
import { useCallback, useMemo, cloneElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { contextConnect } from '../../ui/context';
import { FlyoutContext } from '../context';
import { useFlyoutResizeUpdater } from '../utils';
import FlyoutContent from '../flyout-content';
import { useUpdateEffect } from '../../utils/hooks';
import { useFlyout } from './hook';

/**
 *
 * @param {import('../../ui/context').PolymorphicComponentProps<import('../types').Props, 'div'>} props
 * @param {import('react').Ref<any>}                                                              forwardedRef
 */
function Flyout( props, forwardedRef ) {
	const {
		children,
		elevation,
		label,
		maxWidth,
		onVisibleChange,
		trigger,
		popover,
		...otherProps
	} = useFlyout( props );

	const resizeListener = useFlyoutResizeUpdater( {
		onResize: popover.unstable_update,
	} );

	const uniqueId = `flyout-${ popover.baseId }`;
	const labelId = label || uniqueId;

	const contextProps = useMemo(
		() => ( {
			label: labelId,
			popover,
		} ),
		[ labelId, popover ]
	);

	const triggerContent = useCallback(
		( triggerProps ) => {
			return cloneElement( trigger, triggerProps );
		},
		[ trigger ]
	);

	useUpdateEffect( () => {
		onVisibleChange?.( popover.visible );
	}, [ popover.visible ] );

	return (
		<FlyoutContext.Provider value={ contextProps }>
			{ trigger && (
				<PopoverDisclosure
					{ ...popover }
					ref={ trigger.ref }
					{ ...trigger.props }
				>
					{ triggerContent }
				</PopoverDisclosure>
			) }
			<Portal>
				<FlyoutContent
					ref={ forwardedRef }
					{ ...otherProps }
					elevation={ elevation }
					maxWidth={ maxWidth }
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
 * import { Button, __experimentalFlyout as Flyout, View, Text } from '@wordpress/components';
 *
 * function Example() {
 * 	return (
 * 		<Flyout trigger={ <Button>Show/Hide content</Button> }>
 *			<Text>Code is Poetry</Text>
 * 		</Flyout>
 * 	);
 * }
 * ```
 */
export default contextConnect( Flyout, 'Flyout' );
