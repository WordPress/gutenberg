/**
 * Internal dependencies
 */
import InserterMenu from './menu';
import IconButton from 'components/icon-button';

class Inserter extends wp.element.Component {
	constructor() {
		super( ...arguments );
		this.toggle = this.toggle.bind( this );
		this.close = this.close.bind( this );
		this.state = {
			opened: false
		};
	}

	toggle() {
		this.setState( {
			opened: ! this.state.opened
		} );
	}

	close() {
		this.setState( {
			opened: false
		} );
	}

	render() {
		const { opened } = this.state;
		const { position } = this.props;

		return (
			<div className="editor-inserter">
				<IconButton
					icon="plus-alt"
					label={ wp.i18n.__( 'Insert block' ) }
					onClick={ this.toggle }
					className="editor-inserter__toggle" />
				{ opened && <InserterMenu position={ position } onSelect={ this.close } /> }
			</div>
		);
	}
}

export default Inserter;
