/**
 * External dependencies
 */
import { castArray, filter, first, get, mapKeys, orderBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { Dropdown, IconButton, Toolbar, PanelBody } from '@wordpress/components';
import { getBlockType, getPossibleBlockTransformations, switchToBlockType, hasChildBlocks } from '@wordpress/blocks';
import { Component, Fragment } from '@wordpress/element';
import { DOWN } from '@wordpress/keycodes';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import BlockStyles from '../block-styles';
import BlockPreview from '../block-preview';
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
		const { blocks, onTransform, inserterItems } = this.props;
		const { hoveredClassName } = this.state;

		if ( ! blocks || ! blocks.length ) {
			return null;
		}

		const itemsByName = mapKeys( inserterItems, ( { name } ) => name );
		const possibleBlockTransformations = orderBy(
			filter(
				getPossibleBlockTransformations( blocks ),
				( block ) => !! itemsByName[ block.name ]
			),
			( block ) => itemsByName[ block.name ].frecency,
			'desc'
		);

		const sourceBlockName = blocks[ 0 ].name;
		const blockType = getBlockType( sourceBlockName );
		const hasStyles = blocks.length === 1 && get( blockType, [ 'styles' ], [] ).length !== 0;

		if ( ! hasStyles && ! possibleBlockTransformations.length ) {
			return null;
		}

		return (
			<Dropdown
				position="bottom right"
				className="editor-block-switcher"
				contentClassName="editor-block-switcher__popover"
				renderToggle={ ( { onToggle, isOpen } ) => {
					const openOnArrowDown = ( event ) => {
						if ( ! isOpen && event.keyCode === DOWN ) {
							event.preventDefault();
							event.stopPropagation();
							onToggle();
						}
					};
					const label = sprintf( _n( 'Change block type', 'Change type of %d blocks', blocks.length ), blocks.length );

					return (
						<Toolbar>
							<IconButton
								className="editor-block-switcher__toggle"
								onClick={ onToggle }
								aria-haspopup="true"
								aria-expanded={ isOpen }
								label={ label }
								tooltip={ label }
								onKeyDown={ openOnArrowDown }
							>
								<BlockIcon icon={ blockType.icon && blockType.icon.src } showColors />
							</IconButton>
						</Toolbar>
					);
				} }
				renderContent={ ( { onClose } ) => (
					<Fragment>
						{ hasStyles &&
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
										hasChildBlocks: hasChildBlocks( destinationBlockType.name ),
									} ) ) }
									onSelect={ ( item ) => {
										onTransform( blocks, item.id );
										onClose();
									} }
								/>
							</PanelBody>
						}

						{ ( hoveredClassName !== null ) &&
							<BlockPreview
								name={ blocks[ 0 ].name }
								attributes={ { ...blocks[ 0 ].attributes, className: hoveredClassName } }
							/>
						}
					</Fragment>
				) }
			/>
		);
	}
}

export default compose(
	withSelect( ( select, { clientIds } ) => {
		const { getBlocksByClientId, getBlockRootClientId, getInserterItems } = select( 'core/editor' );
		const rootClientId = getBlockRootClientId( first( castArray( clientIds ) ) );
		return {
			blocks: getBlocksByClientId( clientIds ),
			inserterItems: getInserterItems( rootClientId ),
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => ( {
		onTransform( blocks, name ) {
			dispatch( 'core/editor' ).replaceBlocks(
				ownProps.clientIds,
				switchToBlockType( blocks, name )
			);
		},
	} ) ),
)( BlockSwitcher );
