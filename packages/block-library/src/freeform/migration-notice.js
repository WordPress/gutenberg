/**
 * WordPress dependencies
 */
import { store as blockEditorStore, Warning } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { createBlock, rawHandler, serialize } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Block-level deprecation warning rendered when the
 * `gutenberg-classic-block-deprecation` experiment is enabled.
 *
 * Uses the same `Warning` primitive as `core/missing` so the experience is
 * visually consistent with how the editor already surfaces deprecated blocks,
 * and offers two migration actions - a primary "Convert to blocks", and a
 * secondary "Convert to Custom HTML".
 *
 * @param {Object} props
 * @param {string} props.clientId Client ID of the Classic block.
 * @param {string} props.content  Raw HTML content of the Classic block.
 */
export default function MigrationNotice( { clientId, content } ) {
	const { replaceBlocks } = useDispatch( blockEditorStore );

	const convertToBlocks = () => {
		replaceBlocks(
			clientId,
			rawHandler( {
				HTML: serialize( createBlock( 'core/freeform', { content } ) ),
			} )
		);
	};

	const convertToHtmlBlock = () => {
		replaceBlocks( clientId, createBlock( 'core/html', { content } ) );
	};

	const actions = [
		<Button
			__next40pxDefaultSize
			key="convert-to-blocks"
			variant="primary"
			onClick={ convertToBlocks }
		>
			{ __( 'Convert to blocks' ) }
		</Button>,
		<Button
			__next40pxDefaultSize
			key="convert-to-html"
			variant="secondary"
			onClick={ convertToHtmlBlock }
		>
			{ __( 'Convert to HTML' ) }
		</Button>,
	];

	return (
		<Warning actions={ actions }>
			{ __(
				'The Classic block is being phased out. Convert this content to blocks for the best editing experience, or move it to a Custom HTML block to preserve the markup as-is.'
			) }
		</Warning>
	);
}
