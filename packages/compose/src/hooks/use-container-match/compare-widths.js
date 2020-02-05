export default function compareWidths( operator, queryWidth, containerWidth ) {
	switch ( operator ) {
		case '<':
			return containerWidth < queryWidth;
		case '<=':
			return containerWidth <= queryWidth;
		case '===':
		case '==':
		case '=':
			return containerWidth === queryWidth;
		case '!==':
		case '!=':
			return containerWidth !== queryWidth;
		case '>':
			return containerWidth > queryWidth;
		case '>=':
			return containerWidth >= queryWidth;
		default:
			throw new Error( `Unsupported operator: ${ operator }` );
	}
}
