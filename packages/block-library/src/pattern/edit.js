/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
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
	useEffect( () => {
		if ( selectedPattern && selectedPattern.blocks ) {
			replaceInnerBlocks( clientId, selectedPattern.blocks );
		}
	}, [ selectedPattern ] );

	return <InnerBlocks />;
};

export default PatternEdit;
