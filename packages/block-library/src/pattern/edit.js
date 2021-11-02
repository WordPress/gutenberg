/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import {
	store as blockEditorStore,
	useBlockProps,
} from '@wordpress/block-editor';

const PatternEdit = ( { attributes, clientId } ) => {
	const selectedPattern = useSelect(
		( select ) =>
			select( blockEditorStore ).__experimentalGetParsedPattern(
				attributes.slug
			),
		[ attributes.slug ]
	);

	const {
		replaceBlocks,
		__unstableMarkNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );

	// Run this effect when the component loads.
	// This adds the Pattern's contents to the post.
	// This change won't be saved.
	// It will continue to pull from the pattern file unless changes are made to its respective template part.
	useEffect( () => {
		if ( selectedPattern?.blocks ) {
			__unstableMarkNextChangeAsNotPersistent();
			replaceBlocks( clientId, selectedPattern.blocks );
		}
	}, [ selectedPattern?.blocks ] );

	const props = useBlockProps();

	return <div { ...props } />;
};

export default PatternEdit;
