const AREA_TAGS = {
	footer: 'footer',
	header: 'header',
	uncategorized: 'div',
};

export function getTagBasedOnArea( area ) {
	return AREA_TAGS[ area ] || AREA_TAGS.uncategorized;
}
