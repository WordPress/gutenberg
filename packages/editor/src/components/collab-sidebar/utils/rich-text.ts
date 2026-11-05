import { getBlockType } from '@wordpress/blocks';

/**
 * Key of the block's rich text attribute when that is all the content the
 * block has: exactly one attribute sourced from the markup, and it is rich
 * text. Formats applied across blocks reach only such blocks.
 *
 * A copy of `getSoleRichTextAttributeKey` in the block editor's
 * `multi-block-format-edit.tsx`, which isn't exported.
 *
 * @param blockName Block name.
 * @return Attribute key.
 */
export function getSoleRichTextAttributeKey(
	blockName: string | null | undefined
): string | undefined {
	const sourced = Object.entries(
		getBlockType( blockName ?? '' )?.attributes ?? {}
	).filter( ( [ , { source } ] ) => source );
	return sourced.length === 1 && sourced[ 0 ][ 1 ].source === 'rich-text'
		? sourced[ 0 ][ 0 ]
		: undefined;
}
