const {
	wp: { customize },
} = window;

const inserterOuterSectionId = 'widgets-inserter';

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
