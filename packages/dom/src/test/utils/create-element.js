/**
 * Given an element type, returns an HTMLElement with an emulated layout,
 * since JSDOM does not have its own internal layout engine.
 *
 * @param {string} type Element type.
 *
 * @return {HTMLElement} Layout-emulated element.
 */
export default function createElement( type ) {
	const element = document.createElement( type );

	const ifNotHidden = ( value, elseValue ) =>
		function () {
			let isHidden = false;
			let node = this;
			do {
				// CSS visibility does not remove an element's layout box.
				isHidden = node.style.display === 'none';

				node = node.parentNode;
			} while (
				! isHidden &&
				node &&
				node.nodeType === node.ELEMENT_NODE
			);

			return isHidden ? elseValue : value;
		};

	Object.defineProperties( element, {
		offsetHeight: {
			get: ifNotHidden( 10, 0 ),
		},
		offsetWidth: {
			get: ifNotHidden( 10, 0 ),
		},
	} );

	element.getClientRects = ifNotHidden(
		[
			{
				width: 10,
				height: 10,
				top: 0,
				right: 10,
				bottom: 10,
				left: 0,
			},
		],
		[]
	);

	return element;
}
