/**
 * External dependencies
 */
import { castArray, filter, mapKeys, orderBy, uniq, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import {
	DropdownMenu,
	ToolbarButton,
	ToolbarGroup,
	ToolbarItem,
	MenuGroup,
	Popover,
} from '@wordpress/components';
import {
	getBlockType,
	getPossibleBlockTransformations,
	switchToBlockType,
	cloneBlock,
	getBlockFromExample,
	store as blocksStore,
} from '@wordpress/blocks';
import { Component } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { stack } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import BlockStyles from '../block-styles';
import BlockPreview from '../block-preview';
import BlockTransformationsMenu from './block-transformations-menu';

function PreviewBlockPopover( { hoveredBlock, hoveredClassName } ) {
	const hoveredBlockType = getBlockType( hoveredBlock.name );
	return (
		<div className="block-editor-block-switcher__popover__preview__parent">
			<div className="block-editor-block-switcher__popover__preview__container">
				<Popover
					className="block-editor-block-switcher__preview__popover"
					position="bottom right"
					focusOnMount={ false }
				>
					<div className="block-editor-block-switcher__preview">
						<div className="block-editor-block-switcher__preview-title">
							{ __( 'Preview' ) }
						</div>
						<BlockPreview
							viewportWidth={ 500 }
							blocks={
								hoveredBlockType.example
									? getBlockFromExample( hoveredBlock.name, {
											attributes: {
												...hoveredBlockType.example
													.attributes,
												className: hoveredClassName,
											},
											innerBlocks:
												hoveredBlockType.example
													.innerBlocks,
									  } )
									: cloneBlock( hoveredBlock, {
											className: hoveredClassName,
									  } )
							}
						/>
					</div>
				</Popover>
			</div>
		</div>
	);
}

export class BlockSwitcher extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			hoveredClassName: null,
		};
		this.onHoverClassName = this.onHoverClassName.bind( this );
	}

	onHoverClassName( className ) {
		this.setState( { hoveredClassName: className } );
	}

	render() {
		const {
			blocks,
			onTransform,
			inserterItems,
			hasBlockStyles,
		} = this.props;
		const { hoveredClassName } = this.state;

		if ( ! Array.isArray( blocks ) || ! blocks.length ) {
			return null;
		}

		const [ hoveredBlock ] = blocks;
		const itemsByName = mapKeys( inserterItems, ( { name } ) => name );
		const possibleBlockTransformations = orderBy(
			filter(
				getPossibleBlockTransformations( blocks ),
				( block ) => block && !! itemsByName[ block.name ]
			),
			( block ) => itemsByName[ block.name ].frecency,
			'desc'
		);

		// When selection consists of blocks of multiple types, display an
		// appropriate icon to communicate the non-uniformity.
		const isSelectionOfSameType =
			uniq( map( blocks, 'name' ) ).length === 1;

		let icon;
		if ( isSelectionOfSameType ) {
			const sourceBlockName = hoveredBlock.name;
			const blockType = getBlockType( sourceBlockName );
			icon = blockType.icon;
		} else {
			icon = stack;
		}

		const hasPossibleBlockTransformations = !! possibleBlockTransformations.length;

		if ( ! hasBlockStyles && ! hasPossibleBlockTransformations ) {
			return (
				<ToolbarGroup>
					<ToolbarButton
						disabled
						className="block-editor-block-switcher__no-switcher-icon"
						title={ __( 'Block icon' ) }
						icon={ <BlockIcon icon={ icon } showColors /> }
					/>
				</ToolbarGroup>
			);
		}

		const blockSwitcherLabel =
			1 === blocks.length
				? __( 'Change block type or style' )
				: sprintf(
						/* translators: %s: number of blocks. */
						_n(
							'Change type of %d block',
							'Change type of %d blocks',
							blocks.length
						),
						blocks.length
				  );

		return (
			<ToolbarGroup>
				<ToolbarItem>
					{ ( toggleProps ) => (
						<DropdownMenu
							className="block-editor-block-switcher"
							label={ blockSwitcherLabel }
							popoverProps={ {
								position: 'bottom right',
								isAlternate: true,
								className:
									'block-editor-block-switcher__popover',
							} }
							icon={
								<BlockIcon
									icon={ icon }
									className="block-editor-block-switcher__toggle"
									showColors
								/>
							}
							toggleProps={ toggleProps }
							menuProps={ { orientation: 'both' } }
						>
							{ ( { onClose } ) =>
								( hasBlockStyles ||
									hasPossibleBlockTransformations ) && (
									<div className="block-editor-block-switcher__container">
										{ hasPossibleBlockTransformations && (
											<BlockTransformationsMenu
												className="block-editor-block-switcher__transforms__menugroup"
												possibleBlockTransformations={
													possibleBlockTransformations
												}
												onSelect={ ( name ) => {
													onTransform( blocks, name );
													onClose();
												} }
											/>
										) }
										{ hasBlockStyles && (
											<MenuGroup
												label={ __( 'Styles' ) }
												className="block-editor-block-switcher__styles__menugroup"
											>
												{ hoveredClassName !== null && (
													<PreviewBlockPopover
														hoveredBlock={
															hoveredBlock
														}
														hoveredClassName={
															hoveredClassName
														}
													/>
												) }
												<BlockStyles
													clientId={
														hoveredBlock.clientId
													}
													onSwitch={ onClose }
													onHoverClassName={
														this.onHoverClassName
													}
													itemRole="menuitem"
												/>
											</MenuGroup>
										) }
									</div>
								)
							}
						</DropdownMenu>
					) }
				</ToolbarItem>
			</ToolbarGroup>
		);
	}
}

export default compose(
	withSelect( ( select, { clientIds } ) => {
		const {
			getBlocksByClientId,
			getBlockRootClientId,
			getInserterItems,
		} = select( 'core/block-editor' );
		const { getBlockStyles } = select( blocksStore );
		const rootClientId = getBlockRootClientId(
			castArray( clientIds )[ 0 ]
		);
		const blocks = getBlocksByClientId( clientIds );
		const firstBlock = blocks && blocks.length === 1 ? blocks[ 0 ] : null;
		const styles = firstBlock && getBlockStyles( firstBlock.name );
		return {
			blocks,
			inserterItems: getInserterItems( rootClientId ),
			hasBlockStyles: styles && styles.length > 0,
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => ( {
		onTransform( blocks, name ) {
			dispatch( 'core/block-editor' ).replaceBlocks(
				ownProps.clientIds,
				switchToBlockType( blocks, name )
			);
		},
	} ) )
)( BlockSwitcher );
