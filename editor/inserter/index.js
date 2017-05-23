/**
 * External dependencies
 */
import clickOutside from 'react-click-outside';
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import IconButton from 'components/icon-button';

/**
 * Internal dependencies
 */
import InserterMenu from './menu';
import { getSelectedBlock } from '../selectors';
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

	toggle( event ) {
		// When opening the menu, track reference to the current active element
		// so we know where to restore focus after the menu is closed by escape
		if ( ! this.state.opened ) {
			this.toggleNode = event.currentTarget;
		}

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
			const { selectedBlock, onInsertBlock } = this.props;
			onInsertBlock(
				slug,
				selectedBlock ? selectedBlock.uid : null
			);
		} else if ( this.toggleNode ) {
			// When menu is closed by pressing escape, restore focus to the
			// original opening active element before menu closes
			this.toggleNode.focus();
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
		const { position } = this.props;

		return (
			<div className="editor-inserter">
				<IconButton
					icon="insert"
					label={ wp.i18n.__( 'Insert block' ) }
					onClick={ this.toggle }
					className="editor-inserter__toggle"
					aria-haspopup="true"
					aria-expanded={ opened ? 'true' : 'false' } />
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
