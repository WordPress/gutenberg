
/**
 * Utility function to check whether the domElement provided is editable or not
 * An editable element means we can type in it to edit its content
 * This includes inputs and contenteditables
 *
 * @param  {DomElement} domElement  DOM Element
 * @return {Boolean}                Whether the DOM Element is editable or not
 */
export function isEditableElement( domElement ) {
	return [ 'textarea', 'input', 'select' ].indexOf( domElement.tagName.toLowerCase() ) !== -1
		|| !! domElement.isContentEditable;
}
