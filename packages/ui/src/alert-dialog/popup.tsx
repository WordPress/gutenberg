import { AlertDialog as _AlertDialog } from '@base-ui/react/alert-dialog';
import clsx from 'clsx';
import { forwardRef, useContext } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	type ThemeProvider as ThemeProviderType,
	privateApis as themePrivateApis,
} from '@wordpress/theme';

import { Button } from '../button';
import dialogStyles from '../dialog/style.module.css';
import { unlock } from '../lock-unlock';
import { Stack } from '../stack';
import { Text } from '../text';
import { AlertDialogContext } from './context';
import alertDialogStyles from './style.module.css';
import type { PopupProps } from './types';

const ThemeProvider: typeof ThemeProviderType =
	unlock( themePrivateApis ).ThemeProvider;

const Popup = forwardRef< HTMLDivElement, PopupProps >(
	function AlertDialogPopup(
		{
			className,
			container,
			intent = 'default',
			title,
			description,
			children,
			confirmButtonText = __( 'OK' ),
			cancelButtonText = __( 'Cancel' ),
			...props
		},
		ref
	) {
		const { phase, showSpinner, errorMessage, confirm } =
			useContext( AlertDialogContext );

		const confirmClassName =
			intent === 'irreversible'
				? alertDialogStyles[ 'irreversible-action' ]
				: undefined;

		const buttonsDisabled = phase !== 'idle' || undefined;

		return (
			<_AlertDialog.Portal container={ container }>
				<_AlertDialog.Backdrop className={ dialogStyles.backdrop } />
				<ThemeProvider>
					<_AlertDialog.Popup
						ref={ ref }
						className={ clsx(
							dialogStyles.popup,
							className,
							dialogStyles[ 'is-medium' ]
						) }
						{ ...props }
					>
						<Stack
							direction="column"
							gap="sm"
							className={ alertDialogStyles.header }
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
						<Stack direction="column" gap="md">
							<div className={ dialogStyles.footer }>
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
			</_AlertDialog.Portal>
		);
	}
);

export { Popup };
