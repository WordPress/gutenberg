/**
 * External dependencies
 */
import { noop } from 'lodash';
// eslint-disable-next-line no-restricted-imports
import { PopoverDisclosure, usePopoverState, Portal } from 'reakit';

/**
 * WordPress dependencies
 */
import { useCallback, useMemo, cloneElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { contextConnect, useContextSystem } from '../context';
import { PopoverContext } from './context';
import { usePopoverResizeUpdater } from './utils';
import PopoverContent from './content';
import { useUpdateEffect } from '../../utils/hooks';

/**
 *
 * @param {import('../context').PolymorphicComponentProps<import('./types').Props, 'div'>} props
 * @param {import('react').Ref<any>} forwardedRef
 */
function Popover( props, forwardedRef ) {
	const {
		animated = true,
		animationDuration = 160,
		baseId,
		children,
		elevation = 5,
		id,
		label,
		maxWidth = 360,
		onVisibleChange = noop,
		placement,
		state,
		trigger,
		visible,
		...otherProps
	} = useContextSystem( props, 'Popover' );

	const _popover = usePopoverState( {
		animated: animated ? animationDuration : undefined,
		baseId: baseId || id,
		placement,
		visible,
		...otherProps,
	} );

	const popover = state || _popover;

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
		onVisibleChange( popover.visible );
	}, [ popover.visible ] );

	return (
		<PopoverContext.Provider value={ contextProps }>
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
				<PopoverContent
					ref={ forwardedRef }
					{ ...otherProps }
					elevation={ elevation }
					maxWidth={ maxWidth }
				>
					{ resizeListener }
					{ children }
				</PopoverContent>
			</Portal>
		</PopoverContext.Provider>
	);
}

/**
 * `Popover` is a component to render a floating content modal.
 * It is similar in purpose to a tooltip, but renders content of any sort,
 * not only simple text.
 *
 * @example
 * ```jsx
 * import { Button, Popover, Text } from `@wordpress/components/ui`;
 *
 * function Example() {
 * 	return (
 * 		<Popover trigger={ <Button>Popover</Button> }>
 *			<Text>Code is Poetry</Text>
 * 		</Popover>
 * 	);
 * }
 * ```
 */
export default contextConnect( Popover, 'Popover' );
