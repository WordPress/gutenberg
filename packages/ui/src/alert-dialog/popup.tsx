import { AlertDialog as _AlertDialog } from '@base-ui/react/alert-dialog';
import clsx from 'clsx';
import { forwardRef, useContext, useRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import {
	type ThemeProvider as ThemeProviderType,
	privateApis as themePrivateApis,
} from '@wordpress/theme';

import { renderPortalWithChildren } from '../utils/render-portal-with-children';
import { Button } from '../button';
import dialogStyles from '../dialog/style.module.css';
import { useOverlayScrollStateAttributes } from '../utils/use-overlay-scroll-state-attributes';
import { unlock } from '../lock-unlock';
import { Stack } from '../stack';
import { Text } from '../text';
import { AlertDialogContext } from './context';
import { Portal } from './portal';
import alertDialogStyles from './style.module.css';
import type { PopupProps } from './types';

const ThemeProvider: typeof ThemeProviderType =
	unlock( themePrivateApis ).ThemeProvider;

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
			...props
		},
		ref
	) {
		const { phase, showSpinner, errorMessage, confirm } =
			useContext( AlertDialogContext );

		const popupRef = useRef< HTMLDivElement >( null );
		const mergedRef = useMergeRefs( [ ref, popupRef ] );
		const { onScroll } = useOverlayScrollStateAttributes( popupRef );

		const confirmClassName =
			intent === 'irreversible'
				? alertDialogStyles[ 'irreversible-action' ]
				: undefined;

		const buttonsDisabled = phase !== 'idle' || undefined;

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
						{ ...props }
						onScroll={ onScroll }
					>
						<Stack
							direction="column"
							gap="sm"
							className={ clsx(
								dialogStyles.headerChrome,
								stickyHeader && dialogStyles.headerSticky
							) }
						>
							<Text
								variant="heading-xl"
								render={ <_AlertDialog.Title /> }
							>
								{ title }
							</Text>
							{ description && (
								<Text
									variant="body-md"
									render={ <_AlertDialog.Description /> }
								>
									{ description }
								</Text>
							) }
						</Stack>
						{ children }
						<Stack
							direction="column"
							gap="md"
							className={ clsx(
								dialogStyles.footerChrome,
								stickyFooter && dialogStyles.footerSticky
							) }
						>
							<div
								className={
									alertDialogStyles[ 'footer-actions' ]
								}
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
							</div>
							{ errorMessage && (
								<Text
									variant="body-sm"
									className={
										alertDialogStyles[ 'error-message' ]
									}
								>
									{ errorMessage }
								</Text>
							) }
						</Stack>
					</_AlertDialog.Popup>
				</ThemeProvider>
			</>
		);

		return renderPortalWithChildren( portal, <Portal />, portalChildren );
	}
);

export { Popup };
