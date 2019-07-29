/**
 * External dependencies
 */
import { castArray, filter, first, mapKeys, orderBy, uniq, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { Dropdown, IconButton, Toolbar, PanelBody, Path, SVG } from '@wordpress/components';
import { getBlockType, getPossibleBlockTransformations, switchToBlockType, hasChildBlocksWithInserterSupport, cloneBlock } from '@wordpress/blocks';
import { Component } from '@wordpress/element';
import { DOWN } from '@wordpress/keycodes';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import BlockStyles from '../block-styles';
import { UnifiedBlockPreview } from '../block-preview';
import BlockTypesList from '../block-types-list';

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
		const { blocks, onTransform, inserterItems, hasBlockStyles } = this.props;
		const { hoveredClassName } = this.state;

		if ( ! blocks || ! blocks.length ) {
			return null;
		}

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
		const isSelectionOfSameType = uniq( map( blocks, 'name' ) ).length === 1;

		let icon;
		if ( isSelectionOfSameType ) {
			const sourceBlockName = blocks[ 0 ].name;
			const blockType = getBlockType( sourceBlockName );
			icon = blockType.icon;
		} else {
			icon = 'layout';
		}

		if ( ! hasBlockStyles && ! possibleBlockTransformations.length ) {
			return (
				<Toolbar>
					<IconButton
						disabled
						className="editor-block-switcher__no-switcher-icon block-editor-block-switcher__no-switcher-icon"
						label={ __( 'Block icon' ) }
						icon={ <BlockIcon icon={ icon } showColors /> }
					/>
				</Toolbar>
			);
		}

		return (
			<Dropdown
				position="bottom right"
				className="editor-block-switcher block-editor-block-switcher"
				contentClassName="editor-block-switcher__popover block-editor-block-switcher__popover"
				renderToggle={ ( { onToggle, isOpen } ) => {
					const openOnArrowDown = ( event ) => {
						if ( ! isOpen && event.keyCode === DOWN ) {
							event.preventDefault();
							event.stopPropagation();
							onToggle();
						}
					};
					const label = (
						1 === blocks.length ?
							__( 'Change block type or style' ) :
							sprintf(
								_n(
									'Change type of %d block',
									'Change type of %d blocks',
									blocks.length
								),
								blocks.length
							)
					);

					return (
						<Toolbar>
							<IconButton
								className="editor-block-switcher__toggle block-editor-block-switcher__toggle"
								onClick={ onToggle }
								aria-haspopup="true"
								aria-expanded={ isOpen }
								label={ label }
								tooltip={ label }
								onKeyDown={ openOnArrowDown }
								icon={ (
									<>
										<BlockIcon icon={ icon } showColors />
										<SVG className="editor-block-switcher__transform block-editor-block-switcher__transform" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><Path d="M6.5 8.9c.6-.6 1.4-.9 2.2-.9h6.9l-1.3 1.3 1.4 1.4L19.4 7l-3.7-3.7-1.4 1.4L15.6 6H8.7c-1.4 0-2.6.5-3.6 1.5l-2.8 2.8 1.4 1.4 2.8-2.8zm13.8 2.4l-2.8 2.8c-.6.6-1.3.9-2.1.9h-7l1.3-1.3-1.4-1.4L4.6 16l3.7 3.7 1.4-1.4L8.4 17h6.9c1.3 0 2.6-.5 3.5-1.5l2.8-2.8-1.3-1.4z" /></SVG>
									</>
								) }
							/>
						</Toolbar>
					);
				} }
				renderContent={ ( { onClose } ) => (
					<>
						{ hasBlockStyles &&
							<PanelBody
								title={ __( 'Block Styles' ) }
								initialOpen
							>
								<BlockStyles
									clientId={ blocks[ 0 ].clientId }
									onSwitch={ onClose }
									onHoverClassName={ this.onHoverClassName }
								/>
							</PanelBody>
						}
						{ possibleBlockTransformations.length !== 0 &&
							<PanelBody
								title={ __( 'Transform To:' ) }
								initialOpen
							>
								<BlockTypesList
									items={ possibleBlockTransformations.map( ( destinationBlockType ) => ( {
										id: destinationBlockType.name,
										icon: destinationBlockType.icon,
										title: destinationBlockType.title,
										hasChildBlocksWithInserterSupport: hasChildBlocksWithInserterSupport( destinationBlockType.name ),
									} ) ) }
									onSelect={ ( item ) => {
										onTransform( blocks, item.id );
										onClose();
									} }
								/>
							</PanelBody>
						}

						{ ( hoveredClassName !== null ) &&
							<div className="block-editor-block-switcher__preview">
								<div className="block-editor-block-switcher__preview-title">{ __( 'Preview' ) }</div>
								<UnifiedBlockPreview
									className="block-editor-block-switcher__preview-content"
									blocks={
										cloneBlock( blocks[ 0 ], {
											className: hoveredClassName,
										} )
									}
								/>
							</div>
						}
					</>
				) }
			/>
		);
	}
}

export default compose(
	withSelect( ( select, { clientIds } ) => {
		const { getBlocksByClientId, getBlockRootClientId, getInserterItems } = select( 'core/block-editor' );
		const { getBlockStyles } = select( 'core/blocks' );
		const rootClientId = getBlockRootClientId( first( castArray( clientIds ) ) );
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
	} ) ),
)( BlockSwitcher );
