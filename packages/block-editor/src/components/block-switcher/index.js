/**
 * External dependencies
 */
import { castArray, filter, first, mapKeys, orderBy, uniq, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import {
	Dropdown,
	ToolbarButton,
	ToolbarGroup,
	MenuGroup,
} from '@wordpress/components';
import {
	getBlockType,
	getPossibleBlockTransformations,
	switchToBlockType,
	cloneBlock,
	getBlockFromExample,
} from '@wordpress/blocks';
import { Component } from '@wordpress/element';
import { DOWN } from '@wordpress/keycodes';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { layout } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import BlockStyles from '../block-styles';
import BlockPreview from '../block-preview';
import BlockTypesList from '../block-types-list';

const POPOVER_PROPS = {
	position: 'bottom right',
	isAlternate: true,
};

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

		if ( ! blocks || ! blocks.length ) {
			return null;
		}

		const hoveredBlock = hoveredClassName ? blocks[ 0 ] : null;
		const hoveredBlockType = hoveredClassName
			? getBlockType( hoveredBlock.name )
			: null;

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
			const sourceBlockName = blocks[ 0 ].name;
			const blockType = getBlockType( sourceBlockName );
			icon = blockType.icon;
		} else {
			icon = layout;
		}

		if ( ! hasBlockStyles && ! possibleBlockTransformations.length ) {
			return (
				<ToolbarGroup>
					<ToolbarButton
						disabled
						className="block-editor-block-switcher__no-switcher-icon"
						label={ __( 'Block icon' ) }
						icon={ <BlockIcon icon={ icon } showColors /> }
					/>
				</ToolbarGroup>
			);
		}

		return (
			<Dropdown
				popoverProps={ POPOVER_PROPS }
				className="block-editor-block-switcher"
				contentClassName="block-editor-block-switcher__popover"
				renderToggle={ ( { onToggle, isOpen } ) => {
					const openOnArrowDown = ( event ) => {
						if ( ! isOpen && event.keyCode === DOWN ) {
							event.preventDefault();
							event.stopPropagation();
							onToggle();
						}
					};
					const label =
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
							<ToolbarButton
								className="block-editor-block-switcher__toggle"
								onClick={ onToggle }
								aria-haspopup="true"
								aria-expanded={ isOpen }
								label={ label }
								onKeyDown={ openOnArrowDown }
								showTooltip
								tooltipPosition="bottom"
								icon={ <BlockIcon icon={ icon } showColors /> }
							/>
						</ToolbarGroup>
					);
				} }
				renderContent={ ( { onClose } ) => (
					<>
						{ ( hasBlockStyles ||
							possibleBlockTransformations.length !== 0 ) && (
							<div className="block-editor-block-switcher__container">
								{ hasBlockStyles && (
									<MenuGroup>
										<div className="block-editor-block-switcher__label">
											{ __( 'Styles' ) }
										</div>
										<BlockStyles
											clientId={ blocks[ 0 ].clientId }
											onSwitch={ onClose }
											onHoverClassName={
												this.onHoverClassName
											}
										/>
									</MenuGroup>
								) }
								{ possibleBlockTransformations.length !== 0 && (
									<MenuGroup>
										<div className="block-editor-block-switcher__label">
											{ __( 'Transform to' ) }
										</div>
										<BlockTypesList
											items={ possibleBlockTransformations.map(
												( destinationBlockType ) => ( {
													id:
														destinationBlockType.name,
													icon:
														destinationBlockType.icon,
													title:
														destinationBlockType.title,
												} )
											) }
											onSelect={ ( item ) => {
												onTransform( blocks, item.id );
												onClose();
											} }
										/>
									</MenuGroup>
								) }
							</div>
						) }
						{ hoveredClassName !== null && (
							<div className="block-editor-block-switcher__preview">
								<div className="block-editor-block-switcher__preview-title">
									{ __( 'Preview' ) }
								</div>
								<BlockPreview
									viewportWidth={ 500 }
									blocks={
										hoveredBlockType.example
											? getBlockFromExample(
													hoveredBlock.name,
													{
														attributes: {
															...hoveredBlockType
																.example
																.attributes,
															className: hoveredClassName,
														},
														innerBlocks:
															hoveredBlockType
																.example
																.innerBlocks,
													}
											  )
											: cloneBlock( hoveredBlock, {
													className: hoveredClassName,
											  } )
									}
								/>
							</div>
						) }
					</>
				) }
			/>
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
		const { getBlockStyles } = select( 'core/blocks' );
		const rootClientId = getBlockRootClientId(
			first( castArray( clientIds ) )
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
