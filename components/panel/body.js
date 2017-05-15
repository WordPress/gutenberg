/**
 * WordPress dependencies
 */
import { Component } from 'element';

/**
 * Internal dependencies
 */
import PanelBodyToggle from './body-toggle';

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
					<PanelBodyToggle
						onClick={ this.toggle }
						opened={ this.state.opened }
						label={ toggle }
					/>
				}
				{ this.state.opened && children }
			</div>
		);
	}
}

export default PanelBody;
