export default function( { typeTitle, position, isFirst, isLast, dir } ) {
	if ( isFirst && isLast ) {
		return `Block "${ typeTitle }" is the only block, and cannot be moved`;
	}

	if ( dir > 0 && ! isLast ) {
		// moving down
		return `Move "${ typeTitle }" block from position ${ position }` +
			` down to position ${ position + 1 }`;
	}

	if ( dir > 0 && isLast ) {
		// moving down, and is the last item
		return `Block "${ typeTitle }" is at the end of the content and can’t be moved down`;
	}

	if ( dir < 0 && ! isFirst ) {
		// moving up
		return `Move "${ typeTitle }" block from position ${ position }` +
			` up to position ${ position - 1 }`;
	}

	if ( dir < 0 && isFirst ) {
		// moving up, and is the first item
		return `Block "${ typeTitle }" is at the beginning of the content and can’t be moved up`;
	}

	return '';
}
