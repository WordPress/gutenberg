/**
 * Internal dependencies
 */
import Inserter from './';

class InserterButton extends wp.element.Component {
	constructor() {
		super( ...arguments );
		this.toggle = this.toggle.bind( this );
		this.state = {
			opened: false
		};
	}

	toggle() {
		this.setState( {
			opened: ! this.state.opened
		} );
	}

	render() {
		const { opened } = this.state;

		return (
			<div className="editor-inserter__button">
				<button
					className="editor-inserter__button-toggle"
					onClick={ this.toggle }
					type="button"
					aria-label={ wp.i18n.__( 'Add a block' ) }
				>
					<span className="dashicons dashicons-plus" />
				</button>
				{ opened && <Inserter /> }
			</div>
		);
	}
}

export default InserterButton;
