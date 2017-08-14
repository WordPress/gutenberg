/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { Popover, IconButton } from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import InserterMenu from './menu';
import { getBlockInsertionPoint, getEditorMode } from '../selectors';
import { insertBlock, hideInsertionPoint } from '../actions';

class Inserter extends Component {
	constructor() {
		super( ...arguments );

		this.toggle = this.toggle.bind( this );
		this.close = this.close.bind( this );
		this.closeOnClickOutside = this.closeOnClickOutside.bind( this );
		this.bindNode = this.bindNode.bind( this );
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

	closeOnClickOutside( event ) {
		if ( ! this.node.contains( event.target ) ) {
			this.close();
		}
	}

	bindNode( node ) {
		this.node = node;
	}

	insertBlock( name ) {
		if ( name ) {
			const {
				insertionPoint,
				onInsertBlock,
			} = this.props;
			onInsertBlock(
				name,
				insertionPoint
			);
		}

		this.close();
	}

	render() {
		const { opened } = this.state;
		const { position, children } = this.props;

		return (
			<div ref={ this.bindNode } className="editor-inserter">
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
				<Popover
					isOpen={ opened }
					position={ position }
					onClose={ this.closeOnClickOutside }
				>
					<InserterMenu onSelect={ this.insertBlock } />
				</Popover>
			</div>
		);
	}
}

export default connect(
	( state ) => {
		return {
			insertionPoint: getBlockInsertionPoint( state ),
			mode: getEditorMode( state ),
		};
	},
	( dispatch ) => ( {
		onInsertBlock( name, after ) {
			dispatch( hideInsertionPoint() );
			dispatch( insertBlock(
				createBlock( name ),
				after
			) );
		},
	} )
)( Inserter );
