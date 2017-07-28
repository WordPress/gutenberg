/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { uniq, get, reduce, find } from 'lodash';
import clickOutside from 'react-click-outside';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Component } from 'element';
import { Dashicon, IconButton } from 'components';
import { switchToBlockType } from 'blocks';

/**
 * Internal dependencies
 */
import './style.scss';
import { replaceBlocks } from '../../../actions';
import { getBlock, getBlockTypes } from '../../../selectors';

class BlockSwitcher extends Component {
	constructor() {
		super( ...arguments );
		this.toggleMenu = this.toggleMenu.bind( this );
		this.state = {
			open: false,
		};
	}

	handleClickOutside() {
		if ( ! this.state.open ) {
			return;
		}

		this.toggleMenu();
	}

	toggleMenu() {
		this.setState( ( state ) => ( {
			open: ! state.open,
		} ) );
	}

	getBlockType( name ) {
		return find( this.props.blockTypes, ( bt ) => bt.name === name );
	}

	switchBlockType( name ) {
		return () => {
			this.setState( {
				open: false,
			} );
			this.props.onTransform( this.props.block, this.getBlockType( this.props.block.name ), this.getBlockType( name ) );
		};
	}

	render() {
		const blockType = this.getBlockType( this.props.block.name );
		const blocksToBeTransformedFrom = reduce( this.props.blockTypes, ( memo, block ) => {
			const transformFrom = get( block, 'transforms.from', [] );
			const transformation = find( transformFrom, t => t.type === 'block' && t.blocks.indexOf( this.props.block.name ) !== -1 );
			return transformation ? memo.concat( [ block.name ] ) : memo;
		}, [] );
		const blocksToBeTransformedTo = get( blockType, 'transforms.to', [] )
			.reduce( ( memo, transformation ) => memo.concat( transformation.blocks ), [] );
		const allowedBlocks = uniq( blocksToBeTransformedFrom.concat( blocksToBeTransformedTo ) )
			.reduce( ( memo, name ) => {
				const block = this.getBlockType( name );
				return !! block ? memo.concat( block ) : memo;
			}, [] );

		if ( ! allowedBlocks.length ) {
			return null;
		}

		return (
			<div className="editor-block-switcher">
				<IconButton
					className="editor-block-switcher__toggle"
					icon={ blockType.icon }
					onClick={ this.toggleMenu }
					aria-haspopup="true"
					aria-expanded={ this.state.open }
					label={ __( 'Change block type' ) }
				>
					<Dashicon icon="arrow-down" />
				</IconButton>
				{ this.state.open &&
					<div
						className="editor-block-switcher__menu"
						role="menu"
						tabIndex="0"
						aria-label={ __( 'Block types' ) }
					>
						{ allowedBlocks.map( ( { name, title, icon } ) => (
							<IconButton
								key={ name }
								onClick={ this.switchBlockType( name ) }
								className="editor-block-switcher__menu-item"
								icon={ icon }
								role="menuitem"
							>
								{ title }
							</IconButton>
						) ) }
					</div>
				}
			</div>
		);
	}
}

export default connect(
	( state, ownProps ) => ( {
		block: getBlock( state, ownProps.uid ),
		blockTypes: getBlockTypes( state ),
	} ),
	( dispatch, ownProps ) => ( {
		onTransform( block, blockType ) {
			dispatch( replaceBlocks(
				[ ownProps.uid ],
				switchToBlockType( block, blockType )
			) );
		},
	} ),
	undefined,
	{
		storeKey: 'editor',
	}
)( clickOutside( BlockSwitcher ) );
