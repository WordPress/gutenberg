/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { QueryContent } from './query-content';
import { QueryPatternSetup } from './query-setup';

const CommentsQueryEdit = ( props ) => {
	const { clientId } = props;
	// XXX: not sure if I want to re-use the same mechanism here as there is
	// in the core/query-block.
	const hasInnerBlocks = useSelect(
		( select ) =>
			!! select( blockEditorStore ).getBlocks( clientId ).length,
		[ clientId ]
	);
	const Component = hasInnerBlocks ? QueryContent : QueryPatternSetup;
	return <Component { ...props } />;
};

export default CommentsQueryEdit;
