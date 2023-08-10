/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import { Fragment } from '@wordpress/element';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { createBlock, store as blocksStore } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { InspectorControls } from '../components';
import { store as blockEditorStore } from '../store';

function AutoInsertingBlocksControl( props ) {
	const autoInsertedBlocksForCurrentBlock = useSelect(
		( select ) => {
			const { getBlockTypes } = select( blocksStore );
			return getBlockTypes()?.filter(
				( block ) =>
					block.autoInsert &&
					Object.keys( block.autoInsert ).includes( props.blockName )
			);
		},
		[ props.blockName ]
	);

	const { blocks, blockIndex, rootClientId, innerBlocksLength } = useSelect(
		( select ) => {
			const {
				getBlock,
				getBlockIndex,
				getBlockRootClientId,
				getAdjacentBlockClientId,
			} = select( blockEditorStore );
			const _rootClientId = getBlockRootClientId( props.clientId );

			// It's possible that there are multiple auto-inserted blocks, so in order to
			// locate them all, we have to iterate over all auto-inserted sibiling blocks
			// before or after the current block, respectively. We stop iterating once there
			// are no more blocks, or if we encounter a manually inserted block.
			const _blocks = autoInsertedBlocksForCurrentBlock.reduce(
				( acc, block ) => {
					const relativePosition =
						block?.autoInsert?.[ props.blockName ];

					if ( [ 'before', 'after' ].includes( relativePosition ) ) {
						const direction = relativePosition === 'after' ? 1 : -1;
						let clientId = props.clientId;

						while (
							( clientId = getAdjacentBlockClientId(
								clientId,
								direction
							) )
						) {
							if ( getBlock( clientId )?.name === block.name ) {
								acc[ block.name ] = clientId;
								return acc;
							}

							// Stop if we encounter a non-auto-inserted block. Any block on the other side
							// of a manually inserted block cannot qualify as an auto-inserted block.
							if (
								! autoInsertedBlocksForCurrentBlock.some(
									( autoInsertedBlock ) =>
										autoInsertedBlock.name ===
										getBlock( clientId )?.name
								)
							) {
								return acc;
							}
						}
					} else if (
						[ 'first_child', 'last_child' ].includes(
							relativePosition
						)
					) {
						const { innerBlocks } = getBlock( props.clientId );

						if ( ! innerBlocks?.length ) {
							return acc;
						}

						// Note that the direction is reversed, compared to before/after:
						// E.g. when looking for a potential last child, we have to start at the
						// last element and then go backwards.
						const direction =
							relativePosition === 'last_child' ? -1 : 1;
						let { clientId } = innerBlocks.at(
							relativePosition === 'first_child' ? 0 : -1
						);

						while ( clientId ) {
							if ( getBlock( clientId )?.name === block.name ) {
								acc[ block.name ] = clientId;
								return acc;
							}

							// Stop if we encounter a non-auto-inserted block. Any block on the other side
							// of a manually inserted block cannot qualify as an auto-inserted block.
							if (
								! autoInsertedBlocksForCurrentBlock.some(
									( autoInsertedBlock ) =>
										autoInsertedBlock.name ===
											getBlock( clientId )?.name &&
										autoInsertedBlock.autoInsert[
											props.blockName
										] === relativePosition
								)
							) {
								return acc;
							}

							clientId = getAdjacentBlockClientId(
								clientId,
								direction
							);
						}
					}
					return acc;
				},
				{}
			);

			return {
				blockIndex: getBlockIndex( props.clientId ),
				innerBlocksLength: getBlock( props.clientId )?.innerBlocks
					?.length,
				rootClientId: _rootClientId,
				blocks: _blocks,
			};
		},
		[ autoInsertedBlocksForCurrentBlock, props.blockName, props.clientId ]
	);

	const { insertBlock, removeBlock } = useDispatch( blockEditorStore );

	if ( ! autoInsertedBlocksForCurrentBlock.length ) {
		return null;
	}

	// Group by block namespace (i.e. prefix before the slash).
	const groupedAutoInsertedBlocks = autoInsertedBlocksForCurrentBlock.reduce(
		( groups, block ) => {
			const [ prefix ] = block.name.split( '/' );
			if ( ! groups[ prefix ] ) {
				groups[ prefix ] = [];
			}
			groups[ prefix ].push( block );
			return groups;
		},
		{}
	);

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Plugins' ) } initialOpen={ true }>
				{ Object.keys( groupedAutoInsertedBlocks ).map( ( vendor ) => {
					return (
						<Fragment key={ vendor }>
							<h3>{ vendor }</h3>
							{ groupedAutoInsertedBlocks[ vendor ].map(
								( block ) => {
									// TODO: Display block icon.
									// <BlockIcon icon={ block.icon } />

									const relativePosition =
										block.autoInsert[ props.blockName ];

									const checked = Object.keys(
										blocks
									).includes( block.name );

									return (
										<ToggleControl
											checked={ checked }
											key={ block.title }
											label={ block.title }
											onChange={ () => {
												if ( checked ) {
													// Remove block.
													const clientId =
														blocks[ block.name ];
													removeBlock(
														clientId,
														false
													);
													return;
												}

												// Insert block.
												if (
													[
														'before',
														'after',
													].includes(
														relativePosition
													)
												) {
													const insertionIndex =
														relativePosition ===
														'after'
															? blockIndex + 1
															: blockIndex;

													insertBlock(
														createBlock(
															block.name
														),
														insertionIndex,
														rootClientId,
														false
													);
												} else if (
													[
														'first_child',
														'last_child',
													].includes(
														relativePosition
													)
												) {
													const insertionIndex =
														relativePosition ===
														'first_child'
															? 0
															: innerBlocksLength;
													insertBlock(
														createBlock(
															block.name
														),
														insertionIndex,
														props.clientId,
														false
													);
												}
											} }
										/>
									);
								}
							) }
						</Fragment>
					);
				} ) }
			</PanelBody>
		</InspectorControls>
	);
}

export const withAutoInsertingBlocks = createHigherOrderComponent(
	( BlockEdit ) => {
		return ( props ) => {
			const blockEdit = <BlockEdit key="edit" { ...props } />;
			return (
				<>
					{ blockEdit }
					<AutoInsertingBlocksControl
						blockName={ props.name }
						clientId={ props.clientId }
					/>
				</>
			);
		};
	},
	'withAutoInsertingBlocks'
);

if ( window?.__experimentalAutoInsertingBlocks ) {
	addFilter(
		'editor.BlockEdit',
		'core/auto-inserting-blocks/with-inspector-control',
		withAutoInsertingBlocks
	);
}
