/**
 * WordPress dependencies
 */
import {
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	useBlockProps,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { name as buttonBlockName } from '../button/';

const ALLOWED_BLOCKS = [ buttonBlockName ];
const BUTTONS_TEMPLATE = [ [ 'core/button' ] ];

function ButtonsEdit() {
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
		template: BUTTONS_TEMPLATE,
		orientation: 'horizontal',
		__experimentalLayout: {
			type: 'default',
			alignments: [],
		},
	} );
	return <div { ...innerBlocksProps } />;
}

export default ButtonsEdit;
