export default function( { typeTitle, position, isFirst, isLast, dir } ) {
	const prefix = 'Move "' + typeTitle + '" block from position ' + position;
	let title = '';

	if ( dir > 0 ) {
		// moving down
		title = ( ! isLast ) ?
			prefix + ' down to position ' + ( position + 1 ) :
			'Block "' + typeTitle + '" is at the end of the content and can’t be moved down';
	} else {
		// moving up
		title = ( ! isFirst ) ?
			prefix + ' up to position ' + ( position - 1 ) :
			'Block "' + typeTitle + '" is at the beginning of the content and can’t be moved up';
	}

	return title;
}
