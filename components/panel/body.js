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
		const { toggle, children } = this.props;
		return (
			<div className="components-panel__body">
				{ !! toggle &&
					<IconButton
						className="components-panel__body-toggle"
						onClick={ this.toggle }
						opened={ this.state.opened }
						icon={ this.state.opened ? 'arrow-down' : 'arrow-right' }
					>
						{ toggle }
					</IconButton>
				}
				{ this.state.opened && children }
			</div>
		);
	}
}

export default PanelBody;
