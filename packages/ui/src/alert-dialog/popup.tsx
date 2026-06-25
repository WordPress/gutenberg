import { AlertDialog as _AlertDialog } from '@base-ui/react/alert-dialog';
import clsx from 'clsx';
import { forwardRef, useContext } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { ThemeProvider } from '@wordpress/theme';

import { renderSlotWithChildren } from '../utils/render-slot-with-children';
import { Button } from '../button';
import dialogStyles from '../dialog/style.module.css';
import focusStyles from '../utils/css/focus.module.css';
import overlayChromeStyles from '../utils/css/overlay-chrome.module.css';
import { useDeprioritizedInitialFocus } from '../utils/use-deprioritized-initial-focus';
import {
	SCROLL_CONTAINER_ATTR,
	useOverlayScrollStateAttributes,
} from '../utils/use-overlay-scroll-state-attributes';
import { Stack } from '../stack';
import { Text } from '../text';
import { AlertDialogContext } from './context';
import { Portal } from './portal';
import alertDialogStyles from './style.module.css';
import type { PopupProps } from './types';

const Popup = forwardRef< HTMLDivElement, PopupProps >(
	function AlertDialogPopup(
		{
			className,
			portal,
			intent = 'default',
			title,
			description,
			children,
			confirmButtonText = __( 'OK' ),
			cancelButtonText = __( 'Cancel' ),
			stickyHeader = true,
			stickyFooter = true,
			initialFocus,
			finalFocus,
			...props
		},
		ref
	) {
		const { phase, showSpinner, errorMessage, confirm } =
			useContext( AlertDialogContext );

		/*
		 * Scroll ownership lives on an internal scroll container so the
		 * shared chrome CSS can target `[data-wp-ui-overlay-scroll-container]`
		 * here the same way it does on Dialog.Content / Drawer.Content.
		 * `stickyHeader` / `stickyFooter` control whether the chrome renders
		 * as a sibling of the scroller (pinned) or inside it (scrolls with
		 * the body).
		 */
		const { ref: scrollStateRef, onScroll } =
			useOverlayScrollStateAttributes< HTMLDivElement >();

		/*
		 * Skip the internal scroll container during initial focus
		 * resolution: when the body overflows, that container becomes
		 * `tabindex="0"` (so keyboard users can arrow-scroll it) and
		 * would otherwise win first-tabbable status over the action
		 * buttons. Mirrors the same wiring on Dialog/Drawer popups.
		 */
		const { resolvedInitialFocus, popupRef } = useDeprioritizedInitialFocus(
			{
				initialFocus,
				deprioritizedAttributes: [ SCROLL_CONTAINER_ATTR ],
			}
		);
		const mergedRef = useMergeRefs( [ ref, popupRef ] );

		const confirmClassName =
			intent === 'irreversible'
				? alertDialogStyles[ 'irreversible-action' ]
				: undefined;

		const buttonsDisabled = phase !== 'idle' || undefined;

		const headerElement = (
			<div className={ overlayChromeStyles.header }>
				<Text
					variant="heading-xl"
					render={ <_AlertDialog.Title /> }
					className={ overlayChromeStyles.title }
				>
					{ title }
				</Text>
			</div>
		);

		const footerElement = (
			<div className={ alertDialogStyles[ 'footer-column' ] }>
				<Stack
					direction="row"
					gap="sm"
					justify="flex-end"
					align="center"
				>
					<_AlertDialog.Close
						render={ <Button variant="minimal" /> }
						disabled={ buttonsDisabled }
					>
						{ cancelButtonText }
					</_AlertDialog.Close>
					<Button
						className={ confirmClassName }
						onClick={ confirm }
						loading={ showSpinner || undefined }
						disabled={ buttonsDisabled }
					>
						{ confirmButtonText }
					</Button>
				</Stack>
				{ errorMessage && (
					<Text
						variant="body-sm"
						className={ alertDialogStyles[ 'error-message' ] }
					>
						{ errorMessage }
					</Text>
				) }
			</div>
		);

		const portalChildren = (
			<>
				<_AlertDialog.Backdrop className={ dialogStyles.backdrop } />
				<ThemeProvider>
					<_AlertDialog.Popup
						ref={ mergedRef }
						className={ clsx(
							dialogStyles.popup,
							className,
							dialogStyles[ 'is-medium' ]
						) }
						initialFocus={ resolvedInitialFocus }
						finalFocus={ finalFocus }
						{ ...props }
						data-wp-ui-overlay-modal=""
					>
						{ stickyHeader && headerElement }
						<div
							ref={ scrollStateRef }
							className={ clsx(
								overlayChromeStyles.content,
								focusStyles[ 'outset-ring--focus-visible' ]
							) }
							onScroll={ onScroll }
						>
							{ ! stickyHeader && headerElement }
							{ description && (
								<Text
									variant="body-md"
									render={ <_AlertDialog.Description /> }
								>
									{ description }
								</Text>
							) }
							{ children }
							{ ! stickyFooter && footerElement }
						</div>
						{ stickyFooter && footerElement }
					</_AlertDialog.Popup>
				</ThemeProvider>
			</>
		);

		return renderSlotWithChildren( portal, <Portal />, portalChildren );
	}
);

export { Popup };
