/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import {
	__experimentalHStack as HStack,
	PanelBody,
	ToggleControl,
} from '@wordpress/components';
import { createBlock, store as blocksStore } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { BlockIcon, InspectorControls } from '../components';
import { store as blockEditorStore } from '../store';

const EMPTY_OBJECT = {};

function BlockHooksControlPure( { name, clientId } ) {
	const hookedBlocksForCurrentBlock = useSelect(
		( select ) => {
			const hookedBlocks = select( blocksStore ).getHookedBlocks( name );
			const _hookedBlocksForCurrentBlock = {};
			for ( const relativePosition in hookedBlocks ) {
				_hookedBlocksForCurrentBlock[ relativePosition ] = hookedBlocks[
					relativePosition
				].map( ( blockName ) =>
					select( blocksStore ).getBlockType( blockName )
				);
			}
			return _hookedBlocksForCurrentBlock;
		},
		[ name ]
	);

	const { blockIndex, rootClientId, innerBlocksLength } = useSelect(
		( select ) => {
			const { getBlock, getBlockIndex, getBlockRootClientId } =
				select( blockEditorStore );

			return {
				blockIndex: getBlockIndex( clientId ),
				innerBlocksLength: getBlock( clientId )?.innerBlocks?.length,
				rootClientId: getBlockRootClientId( clientId ),
			};
		},
		[ clientId ]
	);

	const hookedBlockClientIds = useSelect(
		( select ) => {
			const { getBlock, getGlobalBlockCount } =
				select( blockEditorStore );

			const _hookedBlockClientIds = {};
			for ( const relativePosition in hookedBlocksForCurrentBlock ) {
				hookedBlocksForCurrentBlock[ relativePosition ].forEach(
					( block ) => {
						// If the block doesn't exist anywhere in the block tree,
						// we know that we have to set the toggle to disabled.
						if ( getGlobalBlockCount( block.name ) === 0 ) {
							return;
						}

						let candidates;
						switch ( relativePosition ) {
							case 'before':
							case 'after':
								// Any of the current block's siblings (with the right block type) qualifies
								// as a hooked block (inserted `before` or `after` the current one), as the block
								// might've been automatically inserted and then moved around a bit by the user.
								candidates =
									getBlock( rootClientId )?.innerBlocks;
								break;

							case 'first_child':
							case 'last_child':
								// Any of the current block's child blocks (with the right block type) qualifies
								// as a hooked first or last child block, as the block might've been automatically
								// inserted and then moved around a bit by the user.
								candidates = getBlock( clientId ).innerBlocks;
								break;
						}

						const hookedBlock = candidates?.find(
							( candidate ) => candidate.name === block.name
						);

						// If the block exists in the designated location, we consider it hooked
						// and show the toggle as enabled.
						if ( hookedBlock ) {
							_hookedBlockClientIds[ block.name ] =
								hookedBlock.clientId;
						}
					}
				);
			}

			if ( Object.values( _hookedBlockClientIds ).length > 0 ) {
				return _hookedBlockClientIds;
			}

			return EMPTY_OBJECT;
		},
		[ hookedBlocksForCurrentBlock, clientId, rootClientId ]
	);

	const { insertBlock, removeBlock } = useDispatch( blockEditorStore );

	if ( ! Object.keys( hookedBlocksForCurrentBlock ).length ) {
		return null;
	}

	// Group by block namespace (i.e. prefix before the slash).
	const groupedHookedBlocks = Object.values( hookedBlocksForCurrentBlock )
		.flat()
		.reduce( ( groups, block ) => {
			const [ namespace ] = block.name.split( '/' );
			if ( ! groups[ namespace ] ) {
				groups[ namespace ] = [];
			}
			groups[ namespace ].push( block );
			return groups;
		}, {} );

	const insertBlockIntoDesignatedLocation = ( block, relativePosition ) => {
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
		}
	};

	return (
		<InspectorControls>
			<PanelBody
				className="block-editor-hooks__block-hooks"
				title={ __( 'Plugins' ) }
				initialOpen={ true }
			>
				{ Object.keys( groupedHookedBlocks ).map( ( vendor ) => {
					return (
						<Fragment key={ vendor }>
							<h3>{ vendor }</h3>
							{ groupedHookedBlocks[ vendor ].map( ( block ) => {
								const checked =
									block.name in hookedBlockClientIds;

								return (
									<ToggleControl
										checked={ checked }
										key={ block.title }
										label={
											<HStack justify="flex-start">
												<BlockIcon
													icon={ block.icon }
												/>
												<span>{ block.title }</span>
											</HStack>
										}
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
	hasSupport() {
		return true;
	},
};
