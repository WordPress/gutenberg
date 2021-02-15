/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createContext } from '@wordpress/element';

export const untitledMenu = __( '(untitled menu)' );
export const MenuIdContext = createContext();

export { default as useMenuEntity } from './use-menu-entity';
export { default as useNavigationEditor } from './use-navigation-editor';
export { default as useNavigationBlockEditor } from './use-navigation-block-editor';
export { default as useMenuNotifications } from './use-menu-notifications';
export { default as useNavigationEditorMenu } from './use-navigation-editor-menu';
