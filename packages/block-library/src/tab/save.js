/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { anchor, slug, tabIndex } = attributes;
	const tabPanelId = anchor || slug;
	const tabLabelId = tabPanelId + '--tab';

	// The first tab in the set is always active on initial load.
	const blockProps = useBlockProps.save( {
		className: tabIndex === 0 ? 'is-active' : '',
	} );
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );

	return (
		<div
			{ ...innerBlocksProps }
			aria-labelledby={ tabLabelId }
			id={ tabPanelId }
			role="tabpanel"
		/>
	);
}
