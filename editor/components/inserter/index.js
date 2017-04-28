/**
 * Internal dependencies
 */
import InserterMenu from './menu';
import IconButton from 'components/icon-button';

class Inserter extends wp.element.Component {
	constructor() {
		super( ...arguments );
		this.toggle = this.toggle.bind( this );
		this.update = true;

		this.state = {
			toggle: false
		};
	}

	shouldComponentUpdate( nextProps, nextState ) {
		if ( nextState.toggle && ! this.update ) {
			this.update = true;

			this.setState( {
				toggle: false
			} );

			return false;
		}

		return true;
	}

	toggle( e ) {
		const toggle = this.inserter.getElementsByClassName( 'editor-inserter__toggle' );

		if ( 'undefined' !== typeof e.currentTarget && toggle[ 0 ] === e.currentTarget.activeElement ) {
			this.update = false;
		}

		this.setState( ( prevState ) => {
			return {
				toggle: ! prevState.toggle
			};
		} );
	}

	render() {
		const { toggle } = this.state;
		const { position } = this.props;

		return (
			<div className="editor-inserter" ref={ ( inserter ) => { this.inserter = inserter; } }>
				<IconButton
					icon="insert"
					label={ wp.i18n.__( 'Insert block' ) }
					onClick={ this.toggle }
					className="editor-inserter__toggle" />
				{ ( toggle ) && <InserterMenu position={ position } onToggle={ this.toggle } /> }
			</div>
		);
	}
}

export default Inserter;
