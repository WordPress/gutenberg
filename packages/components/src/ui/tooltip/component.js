/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { TooltipReference, useTooltipState } from 'reakit';

/**
 * WordPress dependencies
 */
import { useMemo, cloneElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { contextConnect, useContextSystem } from '../context';
import { TooltipContext } from './context';
import TooltipContent from './content';
import { TooltipShortcut } from './styles';

/**
 * @param {import('../context').PolymorphicComponentProps<import('./types').Props, 'div'>} props
 * @param {import('react').Ref<any>} forwardedRef
 */
function Tooltip( props, forwardedRef ) {
	const {
		animated = true,
		animationDuration = 160,
		baseId,
		children,
		content,
		focusable = true,
		gutter = 4,
		id,
		modal = true,
		placement,
		visible = false,
		shortcut,
		...otherProps
	} = useContextSystem( props, 'Tooltip' );

	const tooltip = useTooltipState( {
		animated: animated ? animationDuration : undefined,
		baseId: baseId || id,
		gutter,
		placement,
		visible,
		...otherProps,
	} );

	const contextProps = useMemo(
		() => ( {
			tooltip,
		} ),
		[ tooltip ]
	);

	return (
		<TooltipContext.Provider value={ contextProps }>
			{ content && (
				<TooltipContent unstable_portal={ modal } ref={ forwardedRef }>
					{ content }
					{ shortcut && <TooltipShortcut shortcut={ shortcut } /> }
				</TooltipContent>
			) }
			{ children && (
				<TooltipReference
					{ ...tooltip }
					{ ...children.props }
					// @ts-ignore If ref doesn't exist that's fine with us, it'll just be undefined, but it can exist on ReactElement and there's no reason to try to scope this (it'll just overcomplicate things)
					ref={ children?.ref }
				>
					{ ( referenceProps ) => {
						if ( ! focusable ) {
							referenceProps.tabIndex = undefined;
						}
						return cloneElement( children, referenceProps );
					} }
				</TooltipReference>
			) }
		</TooltipContext.Provider>
	);
}

/**
 * `Tooltip` is a component that provides context for a user interface element.
 *
 * @example
 * ```jsx
 * import { Tooltip, Text } from `@wordpress/components/ui`;
 *
 * function Example() {
 * 	return (
 * 		<Tooltip content="Code is Poetry">
 * 			<Text>WordPress.org</Text>
 * 		</Tooltip>
 * 	)
 * }
 * ```
 */
const ConnectedTooltip = contextConnect( Tooltip, 'Tooltip' );

export default ConnectedTooltip;
