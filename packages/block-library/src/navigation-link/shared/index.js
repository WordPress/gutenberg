/**
 * Shared components for Navigation Link and Navigation Submenu blocks.
 *
 * This module provides common functionality that can be used by both blocks
 * to reduce code duplication and ensure consistent behavior.
 */

export { Controls, BindingHelpText, MissingEntityHelpText } from './controls';
export { updateAttributes } from './update-attributes';
export {
	useEntityBinding,
	buildNavigationLinkEntityBinding,
} from './use-entity-binding';
export { LinkUI } from '../link-ui';
export { useHandleLinkChange } from './use-handle-link-change';
