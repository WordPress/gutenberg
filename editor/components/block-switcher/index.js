/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { every, uniq, get, reduce, find } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dropdown, Dashicon, IconButton, Toolbar, NavigableMenu } from '@wordpress/components';
import { getBlockType, getBlockTypes, switchToBlockType, BlockIcon } from '@wordpress/blocks';
import { keycodes } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import './style.scss';
import { replaceBlocks } from '../../state/actions';
import { getBlock } from '../../state/selectors';

/**
 * Module Constants
 */
const { DOWN } = keycodes;

function BlockSwitcher( { blocks, onTransform } ) {
	if ( ! blocks || ! blocks[ 0 ] ) {
		return null;
	}
	const isMultiBlock = blocks.length > 1;
	const sourceBlockName = blocks[ 0 ].name;

	if ( isMultiBlock && ! every( blocks, ( block ) => ( block.name === sourceBlockName ) ) ) {
		return null;
	}

	const blockType = getBlockType( sourceBlockName );
	const blocksToBeTransformedFrom = reduce( getBlockTypes(), ( memo, type ) => {
		const transformFrom = get( type, 'transforms.from', [] );
		const transformation = find(
			transformFrom,
			t => t.type === 'block' && t.blocks.indexOf( sourceBlockName ) !== -1 &&
				( ! isMultiBlock || t.isMultiBlock )
		);
		return transformation ? memo.concat( [ type.name ] ) : memo;
	}, [] );
	const blocksToBeTransformedTo = get( blockType, 'transforms.to', [] )
		.reduce(
			( memo, transformation ) =>
				memo.concat( ! isMultiBlock || transformation.isMultiBlock ? transformation.blocks : [] ),
			[]
		);
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

export default connect(
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
)( BlockSwitcher );
