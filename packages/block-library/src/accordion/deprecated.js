/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import metadata from './block.json';

const { attributes, supports } = metadata;

const v1 = {
	attributes,
	supports,
	save() {
		const blockProps = useBlockProps.save( {
			role: 'group',
		} );
		return <div { ...useInnerBlocksProps.save( blockProps ) } />;
	},
};

export default [ v1 ];
