/**
 * Check whether the given element is an input field of type number
 * and has a valueAsNumber
 *
 * @param {Partial<HTMLInputElement>} element The HTML element.
 *
 * @return {boolean} True if the element is input and holds a number.
 */
export default function isNumberInput( element ) {
	const { nodeName, type, valueAsNumber } = element;

	return nodeName === 'INPUT' && type === 'number' && !! valueAsNumber;
}
