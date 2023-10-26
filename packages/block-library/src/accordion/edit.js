/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { name as detailsBlockName } from '../details';

const ALLOWED_BLOCKS = [ detailsBlockName ];

const DEFAULT_BLOCK = {
	name: detailsBlockName,
};

function AccordionEdit( { className } ) {
	const blockProps = useBlockProps( {
		className: classnames( className ),
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
		defaultBlock: DEFAULT_BLOCK,
		template: [ [ detailsBlockName ] ],
		templateInsertUpdatesSelection: true,
	} );

	return <div { ...innerBlocksProps } />;
}

export default AccordionEdit;
