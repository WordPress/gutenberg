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

	const { blocks, blockIndex, rootClientId } = useSelect(
		( select ) => {
			const {
				getBlock,
				getBlockIndex,
				getBlockRootClientId,
				getAdjacentBlockClientId,
			} = select( blockEditorStore );
			const _rootClientId = getBlockRootClientId( props.clientId );

			// Iterate over all auto-inserted blocks after the current block, until there are no more
			// Probably there won't be that many auto-inserted blocks.
			// We still need to check everything after.
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
							if (
								getBlock( clientId )?.blockName ===
								block.blockName
							) {
								acc[ block.name ] = clientId;
								return acc;
							}
						}
					}
					return acc;
				},
				{}
			);

			return {
				blockIndex: getBlockIndex( props.clientId ),
				rootClientId: _rootClientId,
				blocks: _blocks,
			};
		},
		[ autoInsertedBlocksForCurrentBlock, props.blockName, props.clientId ]
	);

	const { insertBlock, removeBlock } = useDispatch( blockEditorStore );

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

									const insertionIndex =
										relativePosition === 'after'
											? blockIndex + 1
											: blockIndex;

									return (
										<ToggleControl
											checked={ checked }
											key={ block.title }
											label={ block.title }
											onChange={ () => {
												if ( ! checked ) {
													if (
														[
															'before',
															'after',
														].includes(
															relativePosition
														)
													) {
														insertBlock(
															createBlock(
																block.name
															),
															insertionIndex,
															rootClientId,
															false
														);
													}
													// TODO: Implement first_child and last_child insertion.
												} else if (
													[
														'before',
														'after',
													].includes(
														relativePosition
													)
												) {
													// Remove block.
													const clientId =
														blocks[ block.name ];
													removeBlock( clientId );
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
