/**
 * WordPress dependencies
 */
import { Component } from 'element';
import IconButton from 'components/icon-button';

class PanelBody extends Component {
	constructor( props ) {
		super( ...arguments );
		this.state = {
			opened: props.initialOpen === undefined ? true : props.initialOpen,
		};
		this.toggle = this.toggle.bind( this );
	}

	toggle( event ) {
		event.preventDefault();
		this.setState( {
			opened: ! this.state.opened,
		} );
	}

	render() {
		const { title, children } = this.props;
		return (
			<div className="components-panel__body">
				{ !! title &&
					<IconButton
						className="components-panel__body-toggle"
						onClick={ this.toggle }
						icon={ this.state.opened ? 'arrow-down' : 'arrow-right' }
					>
						{ title }
					</IconButton>
				}
				{ this.state.opened && children }
			</div>
		);
	}
}

export default PanelBody;
