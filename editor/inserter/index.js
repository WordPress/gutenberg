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
		// so we know where to restore focus after the menu is closed.
		if ( ! this.state.opened ) {
			this.toggleNode = event.currentTarget;
		}

		this.setState( {
			opened: ! this.state.opened,
		} );
	}

	close() {
		// Restore focus to original opening active element before menu closes
		if ( this.toggleNode ) {
			this.toggleNode.focus();
		}

		this.setState( {
			opened: false,
		} );
	}

	insertBlock( slug ) {
		if ( slug ) {
			this.props.onInsertBlock( slug );
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
	undefined,
	( dispatch ) => ( {
		onInsertBlock( slug ) {
			dispatch( {
				type: 'INSERT_BLOCK',
				block: wp.blocks.createBlock( slug ),
			} );
		},
	} )
)( clickOutside( Inserter ) );
