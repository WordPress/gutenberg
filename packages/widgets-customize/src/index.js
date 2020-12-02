/**
 * Internal dependencies
 */
import SidebarBlockEditorControl from './sidebar-block-editor-control';

const { wp } = window;

wp.customize.controlConstructor.sidebar_block_editor = SidebarBlockEditorControl;
export { SidebarBlockEditorControl };
