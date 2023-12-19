/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import {
	Children,
	cloneElement,
	forwardRef,
	createContext,
	useContext,
} from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import type { TooltipProps } from './types';
import Shortcut from '../shortcut';
import { positionToPlacement } from '../popover/utils';
import type { WordPressComponentProps } from '../context';

/**
 * Time over anchor to wait before showing tooltip
 */
export const TOOLTIP_DELAY = 700;

const TooltipContext = createContext( false );

function Tooltip(
	props: WordPressComponentProps< TooltipProps, 'div', false >,
	ref: React.ForwardedRef< any >
) {
	const {
		children,
		delay = TOOLTIP_DELAY,
		hideOnClick = true,
		placement,
		position,
		shortcut,
		text,
		...restProps
	} = props;

	const isNestedInParentTooltip = useContext( TooltipContext );

	const baseId = useInstanceId( Tooltip, 'tooltip' );
	const describedById = text || shortcut ? baseId : undefined;

	const isOnlyChild = Children.count( children ) === 1;
	// console error if more than one child element is added
	if ( ! isOnlyChild ) {
		if ( 'development' === process.env.NODE_ENV ) {
			// eslint-disable-next-line no-console
			console.error(
				'Tooltip should be called with only a single child element.'
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

	// Disable reason: the hook can not run conditionally.
	// eslint-disable-next-line @wordpress/no-unused-vars-before-return
	const tooltipStore = Ariakit.useTooltipStore( {
		placement: computedPlacement,
		showTimeout: delay,
	} );

	if ( isNestedInParentTooltip ) {
		return isOnlyChild
			? cloneElement( children, {
					...restProps,
					ref,
			  } )
			: children;
	}
	return (
		<TooltipContext.Provider value={ true }>
			<Ariakit.TooltipAnchor
				onClick={ hideOnClick ? tooltipStore.hide : undefined }
				store={ tooltipStore }
				render={ isOnlyChild ? children : undefined }
				{ ...restProps }
				ref={ ref }
			>
				{ isOnlyChild ? undefined : children }
			</Ariakit.TooltipAnchor>
			{ isOnlyChild && ( text || shortcut ) && (
				<Ariakit.Tooltip
					unmountOnHide
					className="components-tooltip"
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
		</TooltipContext.Provider>
	);
}

export default forwardRef( Tooltip );
