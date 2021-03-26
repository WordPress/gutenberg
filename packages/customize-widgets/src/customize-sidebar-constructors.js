/**
 * WordPress dependencies
 */
import { render, unmountComponentAtNode } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SidebarBlockEditor from './components/sidebar-block-editor';
import SidebarAdapter from './components/sidebar-block-editor/sidebar-adapter';
import InserterOuterSection from './components/inserter/inserter-outer-section';

const {
	wp: { customize },
} = window;

const inserterId = 'widgets-inserter';

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
	ready() {
		this.inserter = new InserterOuterSection( inserterId, {} );
		customize.section.add( this.inserter );
		this.render();
	}
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
					inserter={ this.inserter }
				/>,
				this.container[ 0 ]
			);
		} else {
			unmountComponentAtNode( this.container[ 0 ] );

			// Close the inserter when the section collapses.
			this.inserter.close();
		}
	}
}

export { SidebarSection, SidebarControl };
