export default function( { typeTitle, position, isFirst, isLast, dir } ) {
	const prefix = 'Move "' + typeTitle + '" block from position ' + position;
	const errorPrefix = 'Block "' + typeTitle + '"';
	let title = '';

	if ( isFirst && isLast ) {
		title = errorPrefix + ' is the only block, and cannot be moved';
	} else if ( dir > 0 ) {
		// moving down
		title = ( ! isLast ) ?
			prefix + ' down to position ' + ( position + 1 ) :
			errorPrefix + ' is at the end of the content and can’t be moved down';
	} else {
		// moving up
		title = ( ! isFirst ) ?
			prefix + ' up to position ' + ( position - 1 ) :
			errorPrefix + ' is at the beginning of the content and can’t be moved up';
	}

	return title;
}
