/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import { Fragment } from '@wordpress/element';
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

	// Group by block name prefix (before the slash).
	const groupedAutoInsertedBlocks = autoInsertedBlocksForCurrentBlock.reduce(
		( acc, block ) => {
			const [ prefix ] = block.name.split( '/' );
			if ( ! acc[ prefix ] ) {
				acc[ prefix ] = [];
			}
			acc[ prefix ].push( block );
			return acc;
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
