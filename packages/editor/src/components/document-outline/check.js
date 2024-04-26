/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Component check if there are any headings (core/heading blocks) present in the document.
 *
 * @param {Object}  props          Props.
 * @param {Element} props.children The child elements to render.
 *
 * @return {Component|null} The rendered child elements or null if there are headings.
 */
export default function DocumentOutlineCheck( { children } ) {
	const hasHeadings = useSelect( ( select ) => {
		const { getGlobalBlockCount } = select( blockEditorStore );

		return getGlobalBlockCount( 'core/heading' ) > 0;
	} );

	if ( hasHeadings ) {
		return null;
	}

	return children;
}
