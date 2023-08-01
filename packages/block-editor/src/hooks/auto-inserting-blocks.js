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
import { InspectorControls } from '../components';

function AutoInsertingBlocksControl( props ) {
	const blocks = useSelect( ( select ) => {
		const { getBlockTypes } = select( blocksStore );
		return getBlockTypes();
	}, [] );

	const autoInsertedBlocksForCurrentBlock = blocks.reduce(
		( autoInsertedBlocks, block ) => {
			if ( ! block.autoInsert ) {
				return autoInsertedBlocks;
			}

			const name = Object.keys( block.autoInsert ).find(
				( n ) => n === props.blockName
			);
			if ( name !== undefined ) {
				autoInsertedBlocks[ block.name ] = block.autoInsert[ name ];
			}
			return autoInsertedBlocks;
		},
		{}
	);

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Plugins' ) } initialOpen={ true }>
				{ Object.keys( autoInsertedBlocksForCurrentBlock ).map(
					( blockName ) => {
						return <div key={ blockName }>{ blockName }</div>;
					}
				) }
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
