/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import { Fragment, useMemo } from '@wordpress/element';
import {
	__experimentalHStack as HStack,
	PanelBody,
	ToggleControl,
} from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { createBlock, store as blocksStore } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { BlockIcon, InspectorControls } from '../components';
import { store as blockEditorStore } from '../store';

const EMPTY_OBJECT = {};

function BlockHooksControl( props ) {
	const blockTypes = useSelect(
		( select ) => select( blocksStore ).getBlockTypes(),
		[]
	);

	const hookedBlocksForCurrentBlock = useMemo(
		() =>
			blockTypes?.filter(
				( { blockHooks } ) =>
					blockHooks && props.blockName in blockHooks
			),
		[ blockTypes, props.blockName ]
	);

	const { blockIndex, rootClientId, innerBlocksLength } = useSelect(
		( select ) => {
			const { getBlock, getBlockIndex, getBlockRootClientId } =
				select( blockEditorStore );

			return {
				blockIndex: getBlockIndex( props.clientId ),
				innerBlocksLength: getBlock( props.clientId )?.innerBlocks
					?.length,
				rootClientId: getBlockRootClientId( props.clientId ),
			};
		},
		[ props.clientId ]
	);

	const hookedBlockClientIds = useSelect(
		( select ) => {
			const { getBlock, getGlobalBlockCount } =
				select( blockEditorStore );

			const _hookedBlockClientIds = hookedBlocksForCurrentBlock.reduce(
				( clientIds, block ) => {
					// If the block doesn't exist anywhere in the block tree,
					// we know that we have to display the toggle for it, and set
					// it to disabled.
					if ( getGlobalBlockCount( block.name ) === 0 ) {
						return clientIds;
					}

					const relativePosition =
						block?.blockHooks?.[ props.blockName ];
					let candidates;

					switch ( relativePosition ) {
						case 'before':
						case 'after':
							// Any of the current block's siblings (with the right block type) qualifies
							// as a hooked block (inserted `before` or `after` the current one), as the block
							// might've been automatically inserted and then moved around a bit by the user.
							candidates = getBlock( rootClientId )?.innerBlocks;
							break;

						case 'first_child':
						case 'last_child':
							// Any of the current block's child blocks (with the right block type) qualifies
							// as a hooked first or last child block, as the block might've been automatically
							// inserted and then moved around a bit by the user.
							candidates = getBlock( props.clientId ).innerBlocks;
							break;
					}

					const hookedBlock = candidates?.find(
						( { name } ) => name === block.name
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
					// but it exists elsewhere in the block tree, we consider it manually inserted.
					// In this case, we take note and will remove the corresponding toggle from the
					// block inspector panel.
					return {
						...clientIds,
						[ block.name ]: false,
					};
				},
				{}
			);

			if ( Object.values( _hookedBlockClientIds ).length > 0 ) {
				return _hookedBlockClientIds;
			}

			return EMPTY_OBJECT;
		},
		[
			hookedBlocksForCurrentBlock,
			props.blockName,
			props.clientId,
			rootClientId,
		]
	);

	const { insertBlock, removeBlock } = useDispatch( blockEditorStore );

	// Remove toggle if block isn't present in the designated location but elsewhere in the block tree.
	const hookedBlocksForCurrentBlockIfNotPresentElsewhere =
		hookedBlocksForCurrentBlock?.filter(
			( block ) => hookedBlockClientIds?.[ block.name ] !== false
		);

	if ( ! hookedBlocksForCurrentBlockIfNotPresentElsewhere.length ) {
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
					props.clientId, // Insert as a child of the current block.
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
													block.blockHooks[
														props.blockName
													];
												insertBlockIntoDesignatedLocation(
													createBlock( block.name ),
													relativePosition
												);
												return;
											}

											// Remove block.
											const clientId =
												hookedBlockClientIds[
													block.name
												];
											removeBlock( clientId, false );
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

export const withBlockHooks = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		const blockEdit = <BlockEdit key="edit" { ...props } />;
		return (
			<>
				{ blockEdit }
				<BlockHooksControl
					blockName={ props.name }
					clientId={ props.clientId }
				/>
			</>
		);
	};
}, 'withBlockHooks' );

if ( window?.__experimentalBlockHooks ) {
	addFilter(
		'editor.BlockEdit',
		'core/block-hooks/with-inspector-control',
		withBlockHooks
	);
}
