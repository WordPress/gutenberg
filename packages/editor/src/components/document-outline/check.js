/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

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
