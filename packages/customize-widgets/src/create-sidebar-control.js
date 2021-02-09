/**
 * WordPress dependencies
 */
import { render } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SidebarBlockEditor from './components/sidebar-block-editor';
import SidebarAdapter from './components/sidebar-block-editor/sidebar-adapter';

const { wp } = window;

export default function createSidebarControl() {
	return wp.customize.Control.extend( {
		ready() {
			render(
				<SidebarBlockEditor
					sidebar={ new SidebarAdapter( this.setting, wp.customize ) }
				/>,
				this.container[ 0 ]
			);
		},
	} );
}
