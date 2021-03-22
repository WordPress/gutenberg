const {
	wp: { customize },
} = window;

const inserterOuterSectionId = 'widgets-inserter';

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

export function getContainer() {
	return document.getElementById(
		`sub-accordion-section-${ inserterOuterSectionId }`
	);
}

export default function initializeInserterOuterSection() {
	const outerSection = new customize.OuterSection(
		inserterOuterSectionId,
		{}
	);

	customize.section.add( outerSection );

	return outerSection;
}
