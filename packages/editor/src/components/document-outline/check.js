/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Component check if there are any headings (core/heading blocks) present in the document.
 *
 * @param {Object}  props          Props.
 * @param {Element} props.children Children to be rendered.
 *
 * @return {Component|null} The component to be rendered or null if there are headings.
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
