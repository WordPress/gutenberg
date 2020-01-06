function isHidden( element ) {
	if ( element.parentElement && isHidden( element.parentElement ) ) {
		return true;
	}
	return (
		! element.style ||
		element.style.display === 'none' ||
		element.style.visibility === 'hidden' ||
		element.hidden
	);
}

function getClientRects() {
	if ( isHidden( this ) ) {
		return [];
	}
	return [ { width: 1, height: 1 } ];
}

if (
	typeof window !== 'undefined' &&
	window.Element.prototype.getClientRects !== getClientRects
) {
	window.Element.prototype.getClientRects = getClientRects;
}
