/**
 * WordPress dependencies
 */
import { render } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SidebarBlockEditor from '../sidebar-block-editor';
import SidebarAdapter from './sidebar-adapter';

const { wp } = window;

const SidebarBlockEditorControl = wp.customize.Control.extend( {
	ready() {
		render(
			<SidebarBlockEditor
				sidebar={ new SidebarAdapter( this.setting, wp.customize ) }
			/>,
			this.container[ 0 ]
		);
	},
} );

export default SidebarBlockEditorControl;
