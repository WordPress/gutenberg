/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

const QueryContent = () => null;

const QueryPatternSetup = () => null;

const PostCommentsQueryEdit = ( props ) => {
	const { clientId } = props;
	const hasInnerBlocks = useSelect(
		( select ) =>
			!! select( blockEditorStore ).getBlocks( clientId ).length,
		[ clientId ]
	);
	const Component = hasInnerBlocks ? QueryContent : QueryPatternSetup;
	return <Component { ...props } />;
};

export default PostCommentsQueryEdit;
