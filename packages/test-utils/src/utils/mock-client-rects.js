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

export default function mockClientRects() {
	const boundGetClientRects = () => window.Element.prototype.getClientRects();

	window.Element.prototype.getClientRects = function getClientRects() {
		if ( isHidden( this ) ) {
			return [];
		}
		return [
			{ width: 1, height: 1 },
		];
	};

	return function restoreClientRects() {
		window.Element.prototype.getClientRects = boundGetClientRects;
	};
}
