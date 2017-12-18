/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dropdown, Dashicon, IconButton, Toolbar, NavigableMenu, withContext } from '@wordpress/components';
import { getBlockType, getPossibleBlockTransformations, switchToBlockType, BlockIcon } from '@wordpress/blocks';
import { compose } from '@wordpress/element';
import { keycodes } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import './style.scss';
import { replaceBlocks } from '../../actions';
import { getBlock } from '../../selectors';

/**
 * Module Constants
 */
const { DOWN } = keycodes;

function BlockSwitcher( { blocks, onTransform, isLocked } ) {
	const allowedBlocks = getPossibleBlockTransformations( blocks );

	if ( isLocked || ! allowedBlocks.length ) {
		return null;
	}

	const sourceBlockName = blocks[ 0 ].name;
	const blockType = getBlockType( sourceBlockName );

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
							icon={ <BlockIcon icon={ blockType.icon } /> }
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
									onTransform( blocks, name );
									onClose();
								} }
								className="editor-block-switcher__menu-item"
								icon={ (
									<span className="editor-block-switcher__block-icon">
										<BlockIcon icon={ icon } />
									</span>
								) }
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

export default compose(
	connect(
		( state, ownProps ) => {
			return {
				blocks: ownProps.uids.map( ( uid ) => getBlock( state, uid ) ),
			};
		},
		( dispatch, ownProps ) => ( {
			onTransform( blocks, name ) {
				dispatch( replaceBlocks(
					ownProps.uids,
					switchToBlockType( blocks, name )
				) );
			},
		} )
	),
	withContext( 'editor' )( ( settings ) => {
		const { templateLock } = settings;

		return {
			isLocked: !! templateLock,
		};
	} ),
)( BlockSwitcher );
