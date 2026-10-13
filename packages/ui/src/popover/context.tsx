import { createOverlayTitleValidation } from '../utils/create-overlay-title-validation';

const popoverTitleValidation = createOverlayTitleValidation( 'Popover' );

/**
 * Hook to access the popover validation context.
 * Returns null in production or if not within a Popover.Popup.
 */
export const usePopoverValidationContext =
	popoverTitleValidation.useValidationContext;

/**
 * Provider component that validates Popover.Title presence in development mode.
 * In production, this component is a no-op and just renders children.
 */
export const PopoverValidationProvider =
	popoverTitleValidation.ValidationProvider;
