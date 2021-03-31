/**
 * Check whether the given element is an input field of type number
 * and has a valueAsNumber
 *
 * @param {Element} element The HTML element.
 *
 * @return {boolean} True if the element is input and holds a number.
 */
export default function isNumberInput( element ) {
	const {
		nodeName,
		type,
		valueAsNumber,
	} = /** @type {HTMLInputElement} */ ( element );

	return nodeName === 'INPUT' && type === 'number' && !! valueAsNumber;
}
