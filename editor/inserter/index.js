/**
 * External dependencies
 */
import clickOutside from 'react-click-outside';
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { IconButton } from 'components';

/**
 * Internal dependencies
 */
import InserterMenu from './menu';
import { getLastMultiSelectedBlockUid, getSelectedBlock } from '../selectors';
import { insertBlock, clearInsertionPoint } from '../actions';

class Inserter extends wp.element.Component {
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
		this.setState( {
			opened: ! this.state.opened,
		} );
	}

	close() {
		this.setState( {
			opened: false,
		} );
	}

	insertBlock( slug ) {
		if ( slug ) {
			const { selectedBlock, lastMultiSelectedBlock, onInsertBlock } = this.props;
			let insertionPoint = null;
			if ( lastMultiSelectedBlock ) {
				insertionPoint = lastMultiSelectedBlock;
			} else if ( selectedBlock ) {
				insertionPoint = selectedBlock.uid;
			}

			onInsertBlock(
				slug,
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
					label={ wp.i18n.__( 'Insert block' ) }
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
			selectedBlock: getSelectedBlock( state ),
			lastMultiSelectedBlock: getLastMultiSelectedBlockUid( state ),
		};
	},
	( dispatch ) => ( {
		onInsertBlock( slug, after ) {
			dispatch( clearInsertionPoint() );
			dispatch( insertBlock(
				wp.blocks.createBlock( slug ),
				after
			) );
		},
	} )
)( clickOutside( Inserter ) );
