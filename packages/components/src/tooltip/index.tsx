/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { Children, cloneElement } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import type { TooltipProps, TooltipInternalContext } from './types';
import Shortcut from '../shortcut';
import { positionToPlacement } from '../popover/utils';
import {
	contextConnect,
	useContextSystem,
	ContextSystemProvider,
} from '../context';
import type { WordPressComponentProps } from '../context';

/**
 * Time over anchor to wait before showing tooltip
 */
export const TOOLTIP_DELAY = 700;

const CONTEXT_VALUE = {
	Tooltip: {
		isNestedInParentTooltip: true,
	},
};

function UnconnectedTooltip(
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

		// From Internal Context system
		isNestedInParentTooltip,

		...restProps
	} = useContextSystem< typeof props & TooltipInternalContext >(
		props,
		'Tooltip'
	);

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

	// Removing the `Ariakit` namespace from the hook name allows ESLint to
	// properly identify the hook, and apply the correct linting rules.
	const useAriakitTooltipStore = Ariakit.useTooltipStore;
	const tooltipStore = useAriakitTooltipStore( {
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
		<ContextSystemProvider value={ CONTEXT_VALUE }>
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
		</ContextSystemProvider>
	);
}

export const Tooltip = contextConnect( UnconnectedTooltip, 'Tooltip' );

export default Tooltip;
