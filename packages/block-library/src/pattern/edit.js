/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	store as blockEditorStore,
	InnerBlocks,
} from '@wordpress/block-editor';

const PatternEdit = ( { attributes, clientId } ) => {
	const selectedPattern = useSelect( ( select ) =>
		select( blockEditorStore ).__experimentalGetParsedPattern(
			attributes.slug
		)
	);
	const { replaceInnerBlocks } = useDispatch( blockEditorStore );
	replaceInnerBlocks( clientId, selectedPattern.blocks );
	return <InnerBlocks />;
};

export default PatternEdit;
