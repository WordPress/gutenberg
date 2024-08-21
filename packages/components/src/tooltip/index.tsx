/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import {
	Children,
	useContext,
	createContext,
	forwardRef,
	cloneElement,
} from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import type {
	TooltipProps,
	TooltipInternalContext as TooltipInternalContextType,
} from './types';
import Shortcut from '../shortcut';
import { positionToPlacement } from '../popover/utils';

const TooltipInternalContext = createContext< TooltipInternalContextType >( {
	isNestedInTooltip: false,
} );

/**
 * Time over anchor to wait before showing tooltip
 */
export const TOOLTIP_DELAY = 700;

const CONTEXT_VALUE = {
	isNestedInTooltip: true,
};

function UnforwardedTooltip(
	props: TooltipProps,
	ref: React.ForwardedRef< any >
) {
	const {
		children,
		className,
		delay = TOOLTIP_DELAY,
		hideOnClick = true,
		placement,
		position,
		shortcut,
		text,

		...restProps
	} = props;

	const { isNestedInTooltip } = useContext( TooltipInternalContext );

	const baseId = useInstanceId( Tooltip, 'tooltip' );
	const describedById = text || shortcut ? baseId : undefined;

	const isOnlyChild = Children.count( children ) === 1;
	// console error if more than one child element is added
	if ( ! isOnlyChild ) {
		if ( 'development' === process.env.NODE_ENV ) {
			// eslint-disable-next-line no-console
			console.error(
				'wp-components.Tooltip should be called with only a single child element.'
			);
		}
	}

	// Compute tooltip's placement:
	// - give priority to `placement` prop, if defined
	// - otherwise, compute it from the legacy `position` prop (if defined)
	// - finally, fallback to the default placement: 'bottom'
	let computedPlacement;
	if ( placement !== undefined ) {
		computedPlacement = placement;
	} else if ( position !== undefined ) {
		computedPlacement = positionToPlacement( position );
		deprecated( '`position` prop in wp.components.tooltip', {
			since: '6.4',
			alternative: '`placement` prop',
		} );
	}
	computedPlacement = computedPlacement || 'bottom';

	const tooltipStore = Ariakit.useTooltipStore( {
		placement: computedPlacement,
		showTimeout: delay,
	} );
	const mounted = tooltipStore.useState( 'mounted' );

	if ( isNestedInTooltip ) {
		return isOnlyChild ? (
			<Ariakit.Role { ...restProps } render={ children } />
		) : (
			children
		);
	}

	// TODO: this is a temporary workaround to minimize the effects of the
	// Ariakit upgrade. Ariakit doesn't pass the `aria-describedby` prop to
	// the tooltip anchor anymore since 0.4.0, so we need to add it manually.
	// See: https://github.com/WordPress/gutenberg/pull/64066
	function addDescribedById( element: React.ReactElement ) {
		return describedById && mounted
			? cloneElement( element, { 'aria-describedby': describedById } )
			: element;
	}

	return (
		<TooltipInternalContext.Provider value={ CONTEXT_VALUE }>
			<Ariakit.TooltipAnchor
				onClick={ hideOnClick ? tooltipStore.hide : undefined }
				store={ tooltipStore }
				render={
					isOnlyChild ? addDescribedById( children ) : undefined
				}
				ref={ ref }
			>
				{ isOnlyChild ? undefined : children }
			</Ariakit.TooltipAnchor>
			{ isOnlyChild && ( text || shortcut ) && (
				<Ariakit.Tooltip
					{ ...restProps }
					className={ clsx( 'components-tooltip', className ) }
					unmountOnHide
					gutter={ 4 }
					id={ describedById }
					overflowPadding={ 0.5 }
					store={ tooltipStore }
				>
					{ text }
					{ shortcut && (
						<Shortcut
							className={
								text ? 'components-tooltip__shortcut' : ''
							}
							shortcut={ shortcut }
						/>
					) }
				</Ariakit.Tooltip>
			) }
		</TooltipInternalContext.Provider>
	);
}
export const Tooltip = forwardRef( UnforwardedTooltip );

export default Tooltip;
