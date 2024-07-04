/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment, useMemo } from '@wordpress/element';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { createBlock, store as blocksStore } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { InspectorControls } from '../components';
import { store as blockEditorStore } from '../store';

const EMPTY_OBJECT = {};

function BlockHooksControlPure( {
	name,
	clientId,
	metadata: { ignoredHookedBlocks = [] } = {},
} ) {
	const blockTypes = useSelect(
		( select ) => select( blocksStore ).getBlockTypes(),
		[]
	);

	// A hooked block added via a filter will not be exposed through a block
	// type's `blockHooks` property; however, if the containing layout has been
	// modified, it will be present in the anchor block's `ignoredHookedBlocks`
	// metadata.
	const hookedBlocksForCurrentBlock = useMemo(
		() =>
			blockTypes?.filter(
				( { name: blockName, blockHooks } ) =>
					( blockHooks && name in blockHooks ) ||
					ignoredHookedBlocks.includes( blockName )
			),
		[ blockTypes, name, ignoredHookedBlocks ]
	);

	const hookedBlockClientIds = useSelect(
		( select ) => {
			const { getBlocks, getBlockRootClientId, getGlobalBlockCount } =
				select( blockEditorStore );

			const rootClientId = getBlockRootClientId( clientId );
			const _hookedBlockClientIds = hookedBlocksForCurrentBlock.reduce(
				( clientIds, block ) => {
					// If the block doesn't exist anywhere in the block tree,
					// we know that we have to set the toggle to disabled.
					if ( getGlobalBlockCount( block.name ) === 0 ) {
						return clientIds;
					}

					const relativePosition = block?.blockHooks?.[ name ];
					let candidates;

					switch ( relativePosition ) {
						case 'before':
						case 'after':
							// Any of the current block's siblings (with the right block type) qualifies
							// as a hooked block (inserted `before` or `after` the current one), as the block
							// might've been automatically inserted and then moved around a bit by the user.
							candidates = getBlocks( rootClientId );
							break;

						case 'first_child':
						case 'last_child':
							// Any of the current block's child blocks (with the right block type) qualifies
							// as a hooked first or last child block, as the block might've been automatically
							// inserted and then moved around a bit by the user.
							candidates = getBlocks( clientId );
							break;

						case undefined:
							// If we haven't found a blockHooks field with a relative position for the hooked
							// block, it means that it was added by a filter. In this case, we look for the block
							// both among the current block's siblings and its children.
							candidates = [
								...getBlocks( rootClientId ),
								...getBlocks( clientId ),
							];
							break;
					}

					const hookedBlock = candidates?.find(
						( candidate ) => candidate.name === block.name
					);

					// If the block exists in the designated location, we consider it hooked
					// and show the toggle as enabled.
					if ( hookedBlock ) {
						return {
							...clientIds,
							[ block.name ]: hookedBlock.clientId,
						};
					}

					// If no hooked block was found in any of its designated locations,
					// we set the toggle to disabled.
					return clientIds;
				},
				{}
			);

			if ( Object.values( _hookedBlockClientIds ).length > 0 ) {
				return _hookedBlockClientIds;
			}

			return EMPTY_OBJECT;
		},
		[ hookedBlocksForCurrentBlock, name, clientId ]
	);

	const { getBlockIndex, getBlockCount, getBlockRootClientId } =
		useSelect( blockEditorStore );
	const { insertBlock, removeBlock } = useDispatch( blockEditorStore );

	if ( ! hookedBlocksForCurrentBlock.length ) {
		return null;
	}

	// Group by block namespace (i.e. prefix before the slash).
	const groupedHookedBlocks = hookedBlocksForCurrentBlock.reduce(
		( groups, block ) => {
			const [ namespace ] = block.name.split( '/' );
			if ( ! groups[ namespace ] ) {
				groups[ namespace ] = [];
			}
			groups[ namespace ].push( block );
			return groups;
		},
		{}
	);

	const insertBlockIntoDesignatedLocation = ( block, relativePosition ) => {
		const blockIndex = getBlockIndex( clientId );
		const innerBlocksLength = getBlockCount( clientId );
		const rootClientId = getBlockRootClientId( clientId );

		switch ( relativePosition ) {
			case 'before':
			case 'after':
				insertBlock(
					block,
					relativePosition === 'after' ? blockIndex + 1 : blockIndex,
					rootClientId, // Insert as a child of the current block's parent
					false
				);
				break;

			case 'first_child':
			case 'last_child':
				insertBlock(
					block,
					// TODO: It'd be great if insertBlock() would accept negative indices for insertion.
					relativePosition === 'first_child' ? 0 : innerBlocksLength,
					clientId, // Insert as a child of the current block.
					false
				);
				break;

			case undefined:
				// If we do not know the relative position, it is because the block was
				// added via a filter. In this case, we default to inserting it after the
				// current block.
				insertBlock(
					block,
					blockIndex + 1,
					rootClientId, // Insert as a child of the current block's parent
					false
				);
				break;
		}
	};

	return (
		<InspectorControls>
			<PanelBody
				className="block-editor-hooks__block-hooks"
				title={ __( 'Plugins' ) }
				initialOpen
			>
				<p className="block-editor-hooks__block-hooks-helptext">
					{ __(
						'Manage the inclusion of blocks added automatically by plugins.'
					) }
				</p>
				{ Object.keys( groupedHookedBlocks ).map( ( vendor ) => {
					return (
						<Fragment key={ vendor }>
							<h3>{ vendor }</h3>
							{ groupedHookedBlocks[ vendor ].map( ( block ) => {
								const checked =
									block.name in hookedBlockClientIds;

								return (
									<ToggleControl
										__nextHasNoMarginBottom
										checked={ checked }
										key={ block.title }
										label={ block.title }
										onChange={ () => {
											if ( ! checked ) {
												// Create and insert block.
												const relativePosition =
													block.blockHooks[ name ];
												insertBlockIntoDesignatedLocation(
													createBlock( block.name ),
													relativePosition
												);
												return;
											}

											// Remove block.
											removeBlock(
												hookedBlockClientIds[
													block.name
												],
												false
											);
										} }
									/>
								);
							} ) }
						</Fragment>
					);
				} ) }
			</PanelBody>
		</InspectorControls>
	);
}

export default {
	edit: BlockHooksControlPure,
	attributeKeys: [ 'metadata' ],
	hasSupport() {
		return true;
	},
};
