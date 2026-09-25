// @ts-expect-error `@wordpress/block-editor` does not expose type declarations for its entry point.
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

const DEFAULT_BLOCK = {
	name: 'core/description-term',
};

export default function Edit() {
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		defaultBlock: DEFAULT_BLOCK,
		directInsert: true,
		templateLock: false,
	} );

	return <dl { ...innerBlocksProps } />;
}
