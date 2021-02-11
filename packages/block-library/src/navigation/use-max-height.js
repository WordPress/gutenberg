export default function ( navItemsElement ) {
	if ( navItemsElement && null !== navItemsElement.current ) {
		const items = Array.from( navItemsElement.current.childNodes );

		return window.getComputedStyle( items[ 0 ] ).height;
	}

	return 0;
}
