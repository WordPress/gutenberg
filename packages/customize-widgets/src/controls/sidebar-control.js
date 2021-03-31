/**
 * WordPress dependencies
 */
import { render, unmountComponentAtNode } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SidebarBlockEditor from '../components/sidebar-block-editor';
import SidebarAdapter from '../components/sidebar-block-editor/sidebar-adapter';
import InserterOuterSection from './inserter-outer-section';

const {
	wp: { customize },
} = window;

const inserterId = 'widgets-inserter';

class SidebarControl extends customize.Control {
	ready() {
		this.inserter = new InserterOuterSection( inserterId, {} );
		customize.section.add( this.inserter );

		this.sectionInstance = customize.section( this.section() );

		this.inspector = this.sectionInstance.inspector;

		this.render();
	}
	onChangeSectionExpanded( expanded, args ) {
		if ( ! args.unchanged ) {
			// Close the inserter when the section collapses.
			if ( ! expanded ) {
				this.inserter.close();
			}

			this.render();
		}
	}
	render() {
		if ( this.sectionInstance.expanded() ) {
			render(
				<SidebarBlockEditor
					sidebar={ new SidebarAdapter( this.setting, customize ) }
					inserter={ this.inserter }
					inspector={ this.inspector }
				/>,
				this.container[ 0 ]
			);
		} else if ( ! this.sectionInstance.hasSubSectionOpened() ) {
			// Don't unmount the node when the sub section (inspector) is opened.
			unmountComponentAtNode( this.container[ 0 ] );
		}
	}
}

export default SidebarControl;
