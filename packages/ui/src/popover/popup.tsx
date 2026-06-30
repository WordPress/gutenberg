import { Popover as _Popover } from '@base-ui/react/popover';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import { useDeprioritizedInitialFocus } from '../utils/use-deprioritized-initial-focus';
import { renderSlotWithChildren } from '../utils/render-slot-with-children';
import { ThemeProvider } from '../utils/theme-provider';
import { PopoverValidationProvider } from './context';
import { Portal } from './portal';
import { Positioner } from './positioner';
import styles from './style.module.css';
import type { PopupProps } from './types';

const CLOSE_ATTR = 'data-wp-ui-popover-close';

/**
 * Renders the floating popup container for the popover content.
 *
 * Handles portal rendering, positioning relative to the anchor, collision
 * avoidance, focus management, and optional backdrop. Use
 * `portal={ <Popover.Portal container={ ... } /> }` for cross-document
 * scenarios such as iframes, and `positioner={ <Popover.Positioner … /> }`
 * to customize placement.
 */
const Popup = forwardRef< HTMLDivElement, PopupProps >( function PopoverPopup(
	{
		backdrop = false,
		children,
		className,
		portal,
		positioner,
		finalFocus,
		initialFocus,
		variant = 'default',
		...props
	},
	ref
) {
	const { resolvedInitialFocus, popupRef } = useDeprioritizedInitialFocus( {
		initialFocus,
		deprioritizedAttributes: [ CLOSE_ATTR ],
	} );
	const mergedPopupRef = useMergeRefs( [ ref, popupRef ] );
	const useDefaultSurface = variant !== 'unstyled';

	const validatedChildren = (
		<PopoverValidationProvider>{ children }</PopoverValidationProvider>
	);

	// The popup is the (transformed) motion layer; visual chrome lives on the
	// inner surface so the arrow's containing block stays borderless. See
	// `style.module.css` for the full rationale.
	const popupChildren = useDefaultSurface ? (
		<div className={ styles.surface }>{ validatedChildren }</div>
	) : (
		validatedChildren
	);

	const backdropElement = backdrop ? (
		<_Popover.Backdrop className={ styles.backdrop } />
	) : null;

	const popupContent = (
		<ThemeProvider>
			<_Popover.Popup
				ref={ mergedPopupRef }
				initialFocus={ resolvedInitialFocus }
				finalFocus={ finalFocus }
				className={ clsx(
					useDefaultSurface && styles.popup,
					className
				) }
				{ ...props }
			>
				{ popupChildren }
			</_Popover.Popup>
		</ThemeProvider>
	);

	const positionedPopup = renderSlotWithChildren(
		positioner,
		<Positioner />,
		popupContent
	);

	const portalChildren = (
		<>
			{ backdropElement }
			{ positionedPopup }
		</>
	);

	return renderSlotWithChildren( portal, <Portal />, portalChildren );
} );

export { Popup };
