import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

const DEFAULT_BLOCK = {
	name: 'core/description-term',
};

export default function Edit() {
	const blockProps = useBlockProps< HTMLDListElement >();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		defaultBlock: DEFAULT_BLOCK,
		directInsert: true,
		templateLock: false,
	} );

	return <dl { ...innerBlocksProps } />;
}
