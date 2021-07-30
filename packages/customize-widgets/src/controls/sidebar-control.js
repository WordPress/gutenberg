/**
 * Internal dependencies
 */
import SidebarAdapter from '../components/sidebar-block-editor/sidebar-adapter';
import getInserterOuterSection from './inserter-outer-section';

const getInserterId = ( controlId ) => `widgets-inserter-${ controlId }`;

export default function getSidebarControl() {
	const {
		wp: { customize },
	} = window;

	return class SidebarControl extends customize.Control {
		constructor( ...args ) {
			super( ...args );

			this.subscribers = new Set();
		}

		ready() {
			const InserterOuterSection = getInserterOuterSection();
			this.inserter = new InserterOuterSection(
				getInserterId( this.id ),
				{}
			);
			customize.section.add( this.inserter );

			this.sectionInstance = customize.section( this.section() );

			this.inspector = this.sectionInstance.inspector;

			this.sidebarAdapter = new SidebarAdapter( this.setting, customize );
		}

		subscribe( callback ) {
			this.subscribers.add( callback );

			return () => {
				this.subscribers.delete( callback );
			};
		}

		onChangeSectionExpanded( expanded, args ) {
			if ( ! args.unchanged ) {
				// Close the inserter when the section collapses.
				if ( ! expanded ) {
					this.inserter.close();
				}

				this.subscribers.forEach( ( subscriber ) =>
					subscriber( expanded, args )
				);
			}
		}
	};
}
