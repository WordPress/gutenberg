/**
 * Internal dependencies
 */
import InserterMenu from './menu';
import IconButton from 'components/icon-button';

class Inserter extends wp.element.Component {
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
			<div className="editor-inserter">
				<IconButton
					icon="plus-alt"
					label={ wp.i18n.__( 'Insert block' ) }
					onClick={ this.toggle }
					className="editor-inserter__toggle" />
				{ opened && <InserterMenu /> }
			</div>
		);
	}
}

export default Inserter;
