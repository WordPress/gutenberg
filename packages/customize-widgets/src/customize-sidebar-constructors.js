/**
 * WordPress dependencies
 */
import { render, unmountComponentAtNode } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SidebarBlockEditor from './components/sidebar-block-editor';
import SidebarAdapter from './components/sidebar-block-editor/sidebar-adapter';

const {
	wp: { customize },
} = window;

class SidebarSection extends customize.Section {
	onChangeExpanded( expanded, args ) {
		super.onChangeExpanded( expanded, args );

		const controls = this.controls();
		controls.forEach( ( control ) => {
			control.onChangeExpanded( expanded, args );
		} );
	}
}

class SidebarControl extends customize.Control {
	onChangeExpanded() {
		this.render();
	}
	expanded() {
		return customize.section( this.section() ).expanded();
	}
	render() {
		if ( this.expanded() ) {
			render(
				<SidebarBlockEditor
					sidebar={ new SidebarAdapter( this.setting, customize ) }
				/>,
				this.container[ 0 ]
			);
		} else {
			unmountComponentAtNode( this.container[ 0 ] );
		}
	}
	ready() {
		this.render();
	}
}

export { SidebarSection, SidebarControl };
