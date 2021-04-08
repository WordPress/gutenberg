/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import InspectorSection from './inspector-section';

const {
	wp: { customize },
} = window;

const getInspectorSectionId = ( sidebarId ) =>
	`widgets-inspector-${ sidebarId }`;

class SidebarSection extends customize.Section {
	ready() {
		this.inspector = new InspectorSection(
			getInspectorSectionId( this.id ),
			{
				title: __( 'Block Settings' ),
				parentSection: this,
				customizeAction: [
					__( 'Customizing' ),
					__( 'Widgets' ),
					this.params.title,
				].join( ' ▸ ' ),
			}
		);
		customize.section.add( this.inspector );
	}
	hasSubSectionOpened() {
		return this.inspector.expanded();
	}
	onChangeExpanded( expanded, _args ) {
		const controls = this.controls();
		const args = {
			..._args,
			completeCallback() {
				controls.forEach( ( control ) => {
					control.onChangeSectionExpanded( expanded, args );
				} );
			},
		};

		if ( args.manualTransition ) {
			if ( expanded ) {
				this.contentContainer.addClass( [ 'busy', 'open' ] );
				this.contentContainer.removeClass( 'is-sub-section-open' );
				this.contentContainer
					.closest( '.wp-full-overlay' )
					.addClass( 'section-open' );
				this.contentContainer.one( 'transitionend', () => {
					this.contentContainer.removeClass( 'busy' );
					args.completeCallback();
				} );
			} else {
				this.contentContainer.addClass( [
					'busy',
					'is-sub-section-open',
				] );
				this.contentContainer
					.closest( '.wp-full-overlay' )
					.addClass( 'section-open' );
				this.contentContainer.removeClass( 'open' );
				this.contentContainer.one( 'transitionend', () => {
					this.contentContainer.removeClass( 'busy' );
					args.completeCallback();
				} );
			}
		} else {
			super.onChangeExpanded( expanded, args );
		}
	}
}

export default SidebarSection;
