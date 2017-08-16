/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { uniq, get, reduce, find, flow } from 'lodash';
import clickOutside from 'react-click-outside';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { Dashicon, IconButton } from '@wordpress/components';
import { withEditorSettings } from '@wordpress/blocks';
import { switchToBlockType, getBlockType } from '@wordpress/block-api';

/**
 * Internal dependencies
 */
import './style.scss';
import { replaceBlocks } from '../actions';
import { getBlock } from '../selectors';

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

	switchBlockType( name ) {
		return () => {
			this.setState( {
				open: false,
			} );
			this.props.onTransform( this.props.block, name, this.props.settings );
		};
	}

	render() {
		const blockType = getBlockType( this.props.block.name, this.props.settings );
		const blocksToBeTransformedFrom = reduce( this.props.settings.blockTypes, ( memo, block ) => {
			const transformFrom = get( block, 'transforms.from', [] );
			const transformation = find( transformFrom, t => t.type === 'block' && t.blocks.indexOf( this.props.block.name ) !== -1 );
			return transformation ? memo.concat( [ block.name ] ) : memo;
		}, [] );
		const blocksToBeTransformedTo = get( blockType, 'transforms.to', [] )
			.reduce( ( memo, transformation ) => memo.concat( transformation.blocks ), [] );
		const allowedBlocks = uniq( blocksToBeTransformedFrom.concat( blocksToBeTransformedTo ) )
			.reduce( ( memo, name ) => {
				const block = getBlockType( name, this.props.settings );
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

const connectComponent = connect(
	( state, ownProps ) => ( {
		block: getBlock( state, ownProps.uid ),
	} ),
	( dispatch, ownProps ) => ( {
		onTransform( block, name, settings ) {
			dispatch( replaceBlocks(
				[ ownProps.uid ],
				switchToBlockType( block, name, settings )
			) );
		},
	} )
);

export default flow(
	clickOutside,
	withEditorSettings(),
	connectComponent,
)( BlockSwitcher );
