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
import { AccessiblePopoverContext } from '../context';
import { usePopoverResizeUpdater } from '../utils';
import AccessiblePopoverContent from '../content';
import { useUpdateEffect } from '../../utils/hooks';
import { useAccessiblePopover } from './hook';

/**
 *
 * @param {import('../../ui/context').PolymorphicComponentProps<import('../types').Props, 'div'>} props
 * @param {import('react').Ref<any>}                                                              forwardedRef
 */
function AccessiblePopover( props, forwardedRef ) {
	const {
		children,
		elevation,
		label,
		maxWidth,
		onVisibleChange,
		trigger,
		popover,
		...otherProps
	} = useAccessiblePopover( props );

	const resizeListener = usePopoverResizeUpdater( {
		onResize: popover.unstable_update,
	} );

	const uniqueId = `popover-${ popover.baseId }`;
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
		<AccessiblePopoverContext.Provider value={ contextProps }>
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
				<AccessiblePopoverContent
					ref={ forwardedRef }
					{ ...otherProps }
					elevation={ elevation }
					maxWidth={ maxWidth }
				>
					{ resizeListener }
					{ children }
				</AccessiblePopoverContent>
			</Portal>
		</AccessiblePopoverContext.Provider>
	);
}

/**
 * `AccessiblePopover` is a component to render a floating content modal.
 * It is similar in purpose to a tooltip, but renders content of any sort,
 * not only simple text.
 *
 * @example
 * ```jsx
 * import { Button, AccessiblePopover, Text } from `@wordpress/components`;
 *
 * function Example() {
 * 	return (
 * 		<AccessiblePopover trigger={ <Button>Show/Hide content</Button> }>
 *			<Text>Code is Poetry</Text>
 * 		</AccessiblePopover>
 * 	);
 * }
 * ```
 */
export default contextConnect( AccessiblePopover, 'AccessiblePopover' );
