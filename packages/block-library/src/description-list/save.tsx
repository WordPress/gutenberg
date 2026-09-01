// @ts-expect-error `@wordpress/block-editor` does not expose type declarations for its entry point.
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function save() {
	return <dl { ...useInnerBlocksProps.save( useBlockProps.save() ) } />;
}
