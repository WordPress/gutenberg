/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { uniq, get, reduce } from 'lodash';
import clickOutside from 'react-click-outside';

/**
 * WordPress dependencies
 */
import IconButton from 'components/icon-button';

/**
 * Internal dependencies
 */
import './style.scss';
import { getBlock } from '../selectors';

class BlockSwitcher extends wp.element.Component {
	constructor() {
		super( ...arguments );
		this.toggleMenu = this.toggleMenu.bind( this );
		this.state = {
			open: false
		};
	}

	handleClickOutside() {
		if ( ! this.state.open ) {
			return;
		}

		this.toggleMenu();
	}

	toggleMenu() {
		this.setState( {
			open: ! this.state.open
		} );
	}

	switchBlockType( blockType ) {
		return () => {
			this.setState( {
				open: false
			} );
			this.props.onTransform( this.props.block, blockType );
		};
	}

	render() {
		const blockSettings = wp.blocks.getBlockSettings( this.props.block.blockType );
		const blocksToBeTransformedFrom = reduce( wp.blocks.getBlocks(), ( memo, block ) => {
			const transformFrom = get( block, 'transforms.from', [] );
			const transformation = transformFrom.find( t => t.blocks.indexOf( this.props.block.blockType ) !== -1 );
			return transformation ? memo.concat( [ block.slug ] ) : memo;
		}, [] );
		const blocksToBeTransformedTo = get( blockSettings, 'transforms.to', [] )
			.reduce( ( memo, transformation ) => memo.concat( transformation.blocks ), [] );
		const allowedBlocks = uniq( blocksToBeTransformedFrom.concat( blocksToBeTransformedTo ) )
			.reduce( ( memo, blockType ) => {
				const block = wp.blocks.getBlockSettings( blockType );
				return !! block ? memo.concat( block ) : memo;
			}, [] );

		if ( ! allowedBlocks.length ) {
			return null;
		}

		return (
			<div className="editor-block-switcher">
				<IconButton
					className="editor-block-switcher__toggle"
					icon={ blockSettings.icon }
					onClick={ this.toggleMenu }
					aria-haspopup="true"
					aria-expanded={ this.state.open }
					label={ wp.i18n.__( 'Change block content type' ) }
				>
					<div className="editor-block-switcher__arrow" />
				</IconButton>
				{ this.state.open &&
					<div
						className="editor-block-switcher__menu"
						role="menu"
						tabIndex="0"
						aria-label={ wp.i18n.__( 'Content types' ) }
					>
						{ allowedBlocks.map( ( { slug, title, icon } ) => (
							<IconButton
								key={ slug }
								onClick={ this.switchBlockType( slug ) }
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
		block: getBlock( state, ownProps.uid )
	} ),
	( dispatch, ownProps ) => ( {
		onTransform( block, blockType ) {
			dispatch( {
				type: 'REPLACE_BLOCKS',
				uids: [ ownProps.uid ],
				blocks: wp.blocks.switchToBlockType( block, blockType )
			} );
		}
	} )
)( clickOutside( BlockSwitcher ) );
