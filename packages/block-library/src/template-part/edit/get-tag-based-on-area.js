const AREA_TAGS = {
	footer: 'footer',
	header: 'header',
	unactegorized: 'div',
};

export function getTagBasedOnArea( area ) {
	return AREA_TAGS[ area ] || AREA_TAGS.unactegorized;
}
