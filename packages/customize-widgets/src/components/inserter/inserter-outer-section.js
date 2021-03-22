const {
	wp: { customize },
} = window;

export const inserterId = 'widgets-inserter';

const OuterSection = customize.OuterSection;
// Override the OuterSection class to handle multiple outer sections.
// It closes all the other outer sections whenever one is opened.
// The result is that at most one outer section can be opened at the same time.
customize.OuterSection = class extends OuterSection {
	onChangeExpanded( expanded, args ) {
		if ( expanded ) {
			customize.section.each( ( section ) => {
				if (
					section.params.type === 'outer' &&
					section.id !== this.id
				) {
					if ( section.expanded() ) {
						section.collapse();
					}
				}
			} );
		}

		return super.onChangeExpanded( expanded, args );
	}
};
// Handle constructor so that "params.type" can be correctly pointed to "outer".
customize.sectionConstructor.outer = customize.OuterSection;

const inserter = new customize.OuterSection( inserterId, {} );

customize.section.add( inserter );

export const inserterContainer = document.getElementById(
	`sub-accordion-section-${ inserterId }`
);

export default inserter;
