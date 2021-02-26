/**
 * External dependencies
 */
import { contextConnect, useContextSystem } from '@wp-g2/context';
import { mergeRefs } from '@wp-g2/utils';
// eslint-disable-next-line no-restricted-imports
import { TooltipReference, useTooltipState } from 'reakit';

/**
 * WordPress dependencies
 */
import { useMemo, cloneElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { TooltipContext } from './context';
import TooltipContent from './content';

/**
 * @param {import('@wp-g2/create-styles').ViewOwnProps<import('./types').Props, 'div'>} props
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

	// @todo(itsjonq) Does `ref` ever really exist on children? What's the use case for this? Why not just pass the forwarded ref? Isn't this just going to unexpectedly swap out the ref from the intended element to another?
	// @ts-ignore
	const childRef = children?.ref;
	const refs = useMemo( () => {
		return mergeRefs( [ forwardedRef, childRef ] );
	}, [ childRef, forwardedRef ] );

	return (
		<TooltipContext.Provider value={ contextProps }>
			{ content && (
				<TooltipContent unstable_portal={ modal }>
					{ content }
				</TooltipContent>
			) }
			{ children && (
				<TooltipReference
					{ ...tooltip }
					{ ...children.props }
					ref={ refs }
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
 * import { Tooltip, Text } from '@wordpress/components/ui';
 *
 * <Tooltip content="Code is Poetry">
 * 	<Text>WordPress.org</Text>
 * </Tooltip>
 * ```
 */
const ConnectedTooltip = contextConnect( Tooltip, 'Tooltip' );

export default ConnectedTooltip;
