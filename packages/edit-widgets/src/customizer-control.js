/**
 * WordPress dependencies
 */
import { render } from '@wordpress/element';

/**
 * Internal dependencies
 */
import CustomizeSidebarBlockEditor from './components/customize-sidebar-block-editor';
import SidebarAdapter from './components/customize-sidebar-block-editor/sidebar-adapter';

const { wp } = window;

const CustomizerControl = wp.customize.Control.extend( {
	ready() {
		render(
			<CustomizeSidebarBlockEditor
				sidebar={ new SidebarAdapter( this.setting, wp.customize ) }
			/>,
			this.container[ 0 ]
		);
	},
} );

export default CustomizerControl;
