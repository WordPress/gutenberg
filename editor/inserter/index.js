/**
 * External dependencies
 */
import clickOutside from 'react-click-outside';
import { connect } from 'react-redux';
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Component } from 'element';
import { IconButton } from 'components';
import { createBlock } from 'blocks';

/**
 * Internal dependencies
 */
import InserterMenu from './menu';
import { getBlockInsertionPoint, getBlockTypes } from '../selectors';
import { insertBlock, hideInsertionPoint } from '../actions';

class Inserter extends Component {
	constructor() {
		super( ...arguments );
		this.toggle = this.toggle.bind( this );
		this.close = this.close.bind( this );
		this.insertBlock = this.insertBlock.bind( this );
		this.state = {
			opened: false,
		};
	}

	toggle() {
		this.setState( ( state ) => ( {
			opened: ! state.opened,
		} ) );
	}

	close() {
		this.setState( {
			opened: false,
		} );
	}

	insertBlock( name ) {
		if ( name ) {
			const { insertionPoint, onInsertBlock, blockTypes } = this.props;
			onInsertBlock(
				find( blockTypes, ( blockType ) => blockType.name === name ),
				insertionPoint
			);
		}

		this.close();
	}

	handleClickOutside() {
		if ( ! this.state.opened ) {
			return;
		}

		this.close();
	}

	render() {
		const { opened } = this.state;
		const { position, children } = this.props;

		return (
			<div className="editor-inserter">
				<IconButton
					icon="insert"
					label={ __( 'Insert block' ) }
					onClick={ this.toggle }
					className="editor-inserter__toggle"
					aria-haspopup="true"
					aria-expanded={ opened }
				>
					{ children }
				</IconButton>
				{ opened && (
					<InserterMenu
						position={ position }
						onSelect={ this.insertBlock }
					/>
				) }
			</div>
		);
	}
}

export default connect(
	( state ) => {
		return {
			insertionPoint: getBlockInsertionPoint( state ),
			blockTypes: getBlockTypes( state ),
		};
	},
	( dispatch ) => ( {
		onInsertBlock( blockType, after ) {
			dispatch( hideInsertionPoint() );
			dispatch( insertBlock(
				createBlock( blockType ),
				after
			) );
		},
	} ),
	undefined,
	{
		storeKey: 'editor',
	}
)( clickOutside( Inserter ) );
