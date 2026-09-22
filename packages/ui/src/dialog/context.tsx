import type { Dialog as _Dialog } from '@base-ui/react/dialog';
import { createOverlayModalContext } from '../utils/create-overlay-modal-context';
import { createOverlayTitleValidation } from '../utils/create-overlay-title-validation';

// -- Modal context ----------------------------------------------------------

const dialogModal =
	createOverlayModalContext< _Dialog.Root.Props[ 'modal' ] >( true );

export const DialogModalProvider = dialogModal.Provider;
export const useDialogModal = dialogModal.useModal;

// -- Validation context (dev-only) ------------------------------------------

const dialogTitleValidation = createOverlayTitleValidation( 'Dialog' );

/**
 * Hook to access the dialog validation context.
 * Returns null in production or if not within a Dialog.Popup.
 */
export const useDialogValidationContext =
	dialogTitleValidation.useValidationContext;

/**
 * Provider component that validates Dialog.Title presence in development mode.
 * In production, this component is a no-op and just renders children.
 */
export const DialogValidationProvider =
	dialogTitleValidation.ValidationProvider;
