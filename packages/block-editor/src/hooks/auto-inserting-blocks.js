/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import { Fragment, useState } from '@wordpress/element';
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
	// FIXME: Properly set toggle state based on presence of auto-inserted block.
	const [ toggleStatus, setToggleStatus ] = useState( false );

	const blocks = useSelect( ( select ) => {
		const { getBlockTypes } = select( blocksStore );
		return getBlockTypes();
	}, [] );

	const { blockIndex, rootClientId } = useSelect(
		( select ) => {
			const { getBlockIndex, getBlockRootClientId } =
				select( blockEditorStore );
			const _rootClientId = getBlockRootClientId( props.clientId );
			return {
				blockIndex: getBlockIndex( props.clientId ),
				rootClientId: _rootClientId,
			};
		},
		[ props.clientId ]
	);

	const { insertBlock } = useDispatch( blockEditorStore );

	const autoInsertedBlocksForCurrentBlock = blocks.filter(
		( block ) =>
			block.autoInsert &&
			Object.keys( block.autoInsert ).includes( props.blockName )
	);

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
									return (
										<ToggleControl
											checked={ toggleStatus }
											key={ block.title }
											label={ block.title }
											onChange={ () => {
												if ( ! toggleStatus ) {
													insertBlock(
														createBlock(
															block.name
														),
														blockIndex + 1,
														rootClientId,
														false
													);
												}

												setToggleStatus(
													! toggleStatus
												);
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
