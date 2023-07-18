function isNumericID( str ) {
	return /^\s*\d+\s*$/.test( str );
}

export default function normalizeRecordKey( postId ) {
	if ( isNumericID( postId ) ) {
		postId = Number( postId );
	}

	return postId;
}
