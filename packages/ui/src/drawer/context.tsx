import type { Drawer as _Drawer } from '@base-ui/react/drawer';
import { createOverlayModalContext } from '../utils/create-overlay-modal-context';
import { createOverlayTitleValidation } from '../utils/create-overlay-title-validation';

// -- Modal context ----------------------------------------------------------

const drawerModal =
	createOverlayModalContext< _Drawer.Root.Props[ 'modal' ] >( true );

export const DrawerModalProvider = drawerModal.Provider;
export const useDrawerModal = drawerModal.useModal;

// -- Validation context (dev-only) ------------------------------------------

const drawerTitleValidation = createOverlayTitleValidation( 'Drawer' );

/**
 * Hook to access the drawer validation context.
 * Returns null in production or if not within a Drawer.Popup.
 */
export const useDrawerValidationContext =
	drawerTitleValidation.useValidationContext;

/**
 * Provider component that validates Drawer.Title presence in development mode.
 * In production, this component is a no-op and just renders children.
 */
export const DrawerValidationProvider =
	drawerTitleValidation.ValidationProvider;
