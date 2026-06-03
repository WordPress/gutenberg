/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import TermsQueryContent from './terms-query-content';
import TermsQueryPlaceholder from './terms-query-placeholder';

const TermsQueryEdit = ( props ) => {
	const hasInnerBlocks = useSelect(
		( select ) =>
			!! select( blockEditorStore ).getBlocks( props.clientId ).length,
		[ props.clientId ]
	);
	const Component = hasInnerBlocks
		? TermsQueryContent
		: TermsQueryPlaceholder;
	return <Component { ...props } />;
};

export default TermsQueryEdit;
