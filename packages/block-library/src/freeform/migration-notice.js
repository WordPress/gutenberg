/**
 * WordPress dependencies
 */
import { Warning } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { createBlock, rawHandler } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Block-level deprecation warning for the Classic block.
 * Uses the same `Warning` primitive as `core/missing` so the experience is
 * visually consistent with how the editor already surfaces deprecated blocks,
 * and offers two migration actions - a primary "Convert to blocks", and a
 * secondary "Convert to HTML".
 *
 * @param {Object}   props
 * @param {string}   props.content   Raw HTML content of the Classic block.
 * @param {Function} props.onReplace Replace the current block with the given blocks.
 */
export default function MigrationNotice( { content, onReplace } ) {
	const actions = [
		<Button
			__next40pxDefaultSize
			key="convert-to-blocks"
			variant="primary"
			onClick={ () => onReplace( rawHandler( { HTML: content } ) ) }
		>
			{ __( 'Convert to blocks' ) }
		</Button>,
		<Button
			__next40pxDefaultSize
			key="convert-to-html"
			variant="secondary"
			onClick={ () =>
				onReplace( createBlock( 'core/html', { content } ) )
			}
		>
			{ __( 'Convert to HTML' ) }
		</Button>,
	];

	return (
		<Warning actions={ actions }>
			{ __(
				'The Classic block is being phased out. Convert this content to blocks for the best editing experience, or move it to a Custom HTML block to preserve the original markup.'
			) }
		</Warning>
	);
}
