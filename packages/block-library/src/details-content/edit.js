/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { View } from '@wordpress/primitives';

const TEMPLATE = [
	[
		'core/paragraph',
		{
			placeholder: __(
				'Add text or blocks that will display when the details block is opened.'
			),
		},
	],
];

function DetailsContentEdit() {
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
		templateLock: false,
	} );

	return <View { ...innerBlocksProps }></View>;
}

export default DetailsContentEdit;
