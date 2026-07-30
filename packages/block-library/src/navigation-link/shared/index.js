/**
 * Shared components for Navigation Link and Navigation Submenu blocks.
 *
 * This module provides common functionality that can be used by both blocks
 * to reduce code duplication and ensure consistent behavior.
 */

export { Controls, getInvalidLinkHelpText } from './controls';
export { updateAttributes } from './update-attributes';
export {
	useEntityBinding,
	buildNavigationLinkEntityBinding,
} from './use-entity-binding';
export { LinkUI } from '../link-ui';
export { useHandleLinkChange } from './use-handle-link-change';
export { useIsInvalidLink } from './use-is-invalid-link';
export { InvalidDraftDisplay } from './invalid-draft-display';
export { useEnableLinkStatusValidation } from './use-enable-link-status-validation';
export { useIsDraggingWithin } from './use-is-dragging-within';
export { selectLabelText } from './select-label-text';
export { useLinkPreview } from './use-link-preview';
