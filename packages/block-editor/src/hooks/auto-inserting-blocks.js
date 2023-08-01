/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import { PanelBody } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { store as blocksStore } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { BlockIcon, InspectorControls } from '../components';

function AutoInsertingBlocksControl( props ) {
	const blocks = useSelect( ( select ) => {
		const { getBlockTypes } = select( blocksStore );
		return getBlockTypes();
	}, [] );

	const autoInsertedBlocksForCurrentBlock = blocks.filter(
		( block ) =>
			block.autoInsert &&
			Object.keys( block.autoInsert ).includes( props.blockName )
	);

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Plugins' ) } initialOpen={ true }>
				{ autoInsertedBlocksForCurrentBlock.map( ( block ) => {
					return (
						<div
							key={ block.name }
							className="block-editor-block-card"
						>
							<BlockIcon icon={ block.icon } />
							<div className="block-editor-block-card__content">
								<h2 className="block-editor-block-card__title">
									{ block.title }
								</h2>
							</div>
						</div>
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
					<AutoInsertingBlocksControl blockName={ props.name } />
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
