/**
 * External dependencies
 */
import { castArray, filter, first, get, mapKeys, orderBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { Dropdown, IconButton, Toolbar, PanelBody, AccessibleSVG } from '@wordpress/components';
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
					const label = (
						1 === blocks.length ?
							__( 'Change block type' ) :
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
								className="editor-block-switcher__toggle"
								onClick={ onToggle }
								aria-haspopup="true"
								aria-expanded={ isOpen }
								label={ label }
								tooltip={ label }
								onKeyDown={ openOnArrowDown }
							>
								<BlockIcon icon={ blockType.icon && blockType.icon.src } showColors />
								<AccessibleSVG className="editor-block-switcher__transform" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6.5 8.9c.6-.6 1.4-.9 2.2-.9h6.9l-1.3 1.3 1.4 1.4L19.4 7l-3.7-3.7-1.4 1.4L15.6 6H8.7c-1.4 0-2.6.5-3.6 1.5l-2.8 2.8 1.4 1.4 2.8-2.8zm13.8 2.4l-2.8 2.8c-.6.6-1.3.9-2.1.9h-7l1.3-1.3-1.4-1.4L4.6 16l3.7 3.7 1.4-1.4L8.4 17h6.9c1.3 0 2.6-.5 3.5-1.5l2.8-2.8-1.3-1.4z" /></AccessibleSVG>
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
