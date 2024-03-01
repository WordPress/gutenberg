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

function recursivelyFindBlockWithName( blocks, name ) {
	for ( const block of blocks ) {
		if ( block.attributes.metadata?.name === name ) {
			return block;
		}

		const found = recursivelyFindBlockWithName( block.innerBlocks, name );
		if ( found ) {
			return found;
		}
	}
}

export default function ResetOverridesControl( props ) {
	const registry = useRegistry();
	const name = props.attributes.metadata?.name;
	const patternWithOverrides = useSelect(
		( select ) => {
			if ( ! name ) {
				return undefined;
			}

			const { getBlockParentsByBlockName, getBlocksByClientId } =
				select( blockEditorStore );
			const patternBlock = getBlocksByClientId(
				getBlockParentsByBlockName( props.clientId, 'core/block' )
			)[ 0 ];

			if ( ! patternBlock?.attributes.content?.[ name ] ) {
				return undefined;
			}

			return patternBlock;
		},
		[ props.clientId, name ]
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
		const block = recursivelyFindBlockWithName( blocks, name );

		const newAttributes = Object.assign(
			// Reset every existing attribute to undefined.
			Object.fromEntries(
				Object.keys( props.attributes ).map( ( key ) => [
					key,
					undefined,
				] )
			),
			// Then assign the original attributes.
			block.attributes
		);

		props.setAttributes( newAttributes );
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
