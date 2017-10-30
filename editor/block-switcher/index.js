/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { uniq, get, reduce, find } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dropdown, Dashicon, IconButton, Toolbar, NavigableMenu } from '@wordpress/components';
import { getBlockType, getBlockTypes, switchToBlockType } from '@wordpress/blocks';
import { keycodes } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import './style.scss';
import { replaceBlocks } from '../actions';
import { getBlock } from '../selectors';

/**
 * Module Constants
 */
const { DOWN } = keycodes;

function BlockSwitcher( { block, onTransform } ) {
	if ( ! block ) {
		return null;
	}

	const blockType = getBlockType( block.name );
	const blocksToBeTransformedFrom = reduce( getBlockTypes(), ( memo, type ) => {
		const transformFrom = get( type, 'transforms.from', [] );
		const transformation = find( transformFrom, t => t.type === 'block' && t.blocks.indexOf( block.name ) !== -1 );
		return transformation ? memo.concat( [ type.name ] ) : memo;
	}, [] );
	const blocksToBeTransformedTo = get( blockType, 'transforms.to', [] )
		.reduce( ( memo, transformation ) => memo.concat( transformation.blocks ), [] );
	const allowedBlocks = uniq( blocksToBeTransformedFrom.concat( blocksToBeTransformedTo ) )
		.reduce( ( memo, name ) => {
			const type = getBlockType( name );
			return !! type ? memo.concat( type ) : memo;
		}, [] );

	if ( ! allowedBlocks.length ) {
		return null;
	}

	return (
		<Dropdown
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

				return (
					<Toolbar>
						<IconButton
							className="editor-block-switcher__toggle"
							icon={ blockType.icon }
							onClick={ onToggle }
							aria-haspopup="true"
							aria-expanded={ isOpen }
							label={ __( 'Change block type' ) }
							onKeyDown={ openOnArrowDown }
						>
							<Dashicon icon="arrow-down" />
						</IconButton>
					</Toolbar>
				);
			} }
			renderContent={ ( { onClose } ) => (
				<div>
					<span
						className="editor-block-switcher__menu-title"
					>
						{ __( 'Transform into:' ) }
					</span>
					<NavigableMenu
						role="menu"
						aria-label={ __( 'Block types' ) }
					>
						{ allowedBlocks.map( ( { name, title, icon } ) => (
							<IconButton
								key={ name }
								onClick={ () => {
									onTransform( block, name );
									onClose();
								} }
								className="editor-block-switcher__menu-item"
								icon={ icon }
								role="menuitem"
							>
								{ title }
							</IconButton>
						) ) }
					</NavigableMenu>
				</div>
			) }
		/>
	);
}

export default connect(
	( state, ownProps ) => ( {
		block: getBlock( state, ownProps.uid ),
	} ),
	( dispatch, ownProps ) => ( {
		onTransform( block, name ) {
			dispatch( replaceBlocks(
				[ ownProps.uid ],
				switchToBlockType( block, name )
			) );
		},
	} )
)( BlockSwitcher );
