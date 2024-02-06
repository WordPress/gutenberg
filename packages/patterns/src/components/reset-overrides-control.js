/**
 * WordPress dependencies
 */
import {
	store as blockEditorStore,
	BlockControls,
} from '@wordpress/block-editor';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useSelect, useRegistry } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { parse } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

function recursivelyFindBlockWithId( blocks, id ) {
	return blocks.find( ( block ) => {
		if ( block.attributes.metadata?.id === id ) {
			return block;
		}

		return recursivelyFindBlockWithId( block.innerBlocks, id );
	} );
}

export default function ResetOverridesControl( props ) {
	const registry = useRegistry();
	const id = props.attributes.metadata?.id;
	const patternWithOverrides = useSelect(
		( select ) => {
			if ( ! id ) {
				return undefined;
			}

			const { getBlockParentsByBlockName, getBlocksByClientId } =
				select( blockEditorStore );
			const patternBlock = getBlocksByClientId(
				getBlockParentsByBlockName( props.clientId, 'core/block' )
			)[ 0 ];

			if ( ! patternBlock?.attributes.content?.[ id ] ) {
				return undefined;
			}

			return patternBlock;
		},
		[ props.clientId, id ]
	);

	const resetOverrides = async () => {
		const editedRecord = await registry
			.resolveSelect( coreStore )
			.getEditedEntityRecord(
				'postType',
				'wp_block',
				patternWithOverrides.attributes.ref
			);
		const blocks = editedRecord.blocks ?? parse( editedRecord.content );
		const block = recursivelyFindBlockWithId( blocks, id );

		props.setAttributes( block.attributes );
	};

	return (
		<BlockControls group="other">
			<ToolbarGroup>
				<ToolbarButton
					onClick={ resetOverrides }
					disabled={ ! patternWithOverrides }
					__experimentalIsFocusable
				>
					{ __( 'Reset' ) }
				</ToolbarButton>
			</ToolbarGroup>
		</BlockControls>
	);
}
