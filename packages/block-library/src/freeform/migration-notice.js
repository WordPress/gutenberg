/**
 * WordPress dependencies
 */
import { store as blockEditorStore, Warning } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { createBlock, rawHandler, serialize } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Block-level deprecation warning rendered when the
 * `gutenberg-classic-block-migration-notice` experiment is enabled.
 *
 * Mirrors the existing `core/missing` deprecation treatment for orphaned
 * Classic blocks: a `Warning` with a primary "Convert to blocks" action and a
 * secondary "Convert to Custom HTML" escape hatch.
 *
 * @param {Object} props
 * @param {string} props.clientId Client ID of the Classic block.
 */
export default function MigrationNotice( { clientId } ) {
	const { replaceBlocks } = useDispatch( blockEditorStore );

	const { block, canRemove } = useSelect(
		( select ) => {
			const store = select( blockEditorStore );
			return {
				block: store.getBlock( clientId ),
				canRemove: store.canRemoveBlock( clientId ),
			};
		},
		[ clientId ]
	);

	if ( ! block || ! canRemove ) {
		return null;
	}

	const content = block.attributes?.content ?? '';
	const hasContent = !! content.trim();

	const convertToBlocks = () => {
		replaceBlocks(
			block.clientId,
			rawHandler( { HTML: serialize( block ) } )
		);
	};

	const convertToHtmlBlock = () => {
		replaceBlocks(
			block.clientId,
			createBlock( 'core/html', { content } )
		);
	};

	const actions = [
		<Button
			__next40pxDefaultSize
			key="convert-to-blocks"
			variant="primary"
			onClick={ convertToBlocks }
			disabled={ ! hasContent }
			accessibleWhenDisabled
		>
			{ __( 'Convert to blocks' ) }
		</Button>,
		<Button
			__next40pxDefaultSize
			key="convert-to-html"
			variant="secondary"
			onClick={ convertToHtmlBlock }
			disabled={ ! hasContent }
			accessibleWhenDisabled
		>
			{ __( 'Convert to Custom HTML' ) }
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
