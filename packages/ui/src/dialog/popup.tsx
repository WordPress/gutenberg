import { Dialog as _Dialog } from '@base-ui/react/dialog';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import { ThemeProvider } from '@wordpress/theme';
import { useDeprioritizedInitialFocus } from '../utils/use-deprioritized-initial-focus';
import { SCROLL_CONTAINER_ATTR } from '../utils/use-overlay-scroll-state-attributes';
import { renderSlotWithChildren } from '../utils/render-slot-with-children';
import { DialogValidationProvider, useDialogModal } from './context';
import { Portal } from './portal';
import styles from './style.module.css';
import type { PopupProps } from './types';

const CLOSE_ICON_ATTR = 'data-wp-ui-dialog-close-icon';

/**
 * Renders the dialog popup element that contains the dialog content.
 * Uses a portal to render outside the DOM hierarchy.
 *
 * When `portal` is omitted, defaults to `Dialog.Portal`.
 */
const Popup = forwardRef< HTMLDivElement, PopupProps >( function DialogPopup(
	{
		className,
		portal,
		children,
		size = 'medium',
		initialFocus,
		finalFocus,
		...props
	},
	ref
) {
	const { resolvedInitialFocus, popupRef } = useDeprioritizedInitialFocus( {
		initialFocus,
		deprioritizedAttributes: [ CLOSE_ICON_ATTR, SCROLL_CONTAINER_ATTR ],
	} );
	const mergedRef = useMergeRefs( [ ref, popupRef ] );
	const modal = useDialogModal();

	const portalChildren = (
		<>
			{ /*
			 * Only render a backdrop for fully modal dialogs. Non-modal dialogs
			 * should not dim the page, and `trap-focus` keeps outside pointer
			 * interactions enabled, so a backdrop would misrepresent that mode.
			 */ }
			{ modal === true && (
				<_Dialog.Backdrop
					className={ styles.backdrop }
					data-testid="dialog-backdrop"
				/>
			) }
			<ThemeProvider>
				<_Dialog.Popup
					ref={ mergedRef }
					className={ clsx(
						styles.popup,
						className,
						styles[ `is-${ size }` ]
					) }
					initialFocus={ resolvedInitialFocus }
					finalFocus={ finalFocus }
					{ ...props }
					data-wp-ui-overlay-modal={ modal === true ? '' : undefined }
				>
					<DialogValidationProvider>
						{ children }
					</DialogValidationProvider>
				</_Dialog.Popup>
			</ThemeProvider>
		</>
	);

	return renderSlotWithChildren( portal, <Portal />, portalChildren );
} );

export { Popup };
