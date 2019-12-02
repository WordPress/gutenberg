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

window.Element.prototype.getClientRects = function() {
	if ( isHidden( this ) ) {
		return [];
	}
	return [
		{ width: 1, height: 1 },
	];
};
