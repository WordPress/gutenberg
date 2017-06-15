/**
 * WordPress dependencies
 */
import { Component } from 'element';
import { __, sprintf } from 'i18n';

/**
 * Internal dependencies
 */
import IconButton from '../icon-button';

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
				{ !! title && (
					<h3 className="components-panel__body-title">
						<IconButton
							className="components-panel__body-toggle"
							onClick={ this.toggle }
							icon={ this.state.opened ? 'arrow-down' : 'arrow-right' }
							aria-expanded={ this.state.opened }
							label={ sprintf( __( 'Open section: %s' ), title ) }
						>
							{ title }
						</IconButton>
					</h3>
				) }
				{ this.state.opened && children }
			</div>
		);
	}
}

export default PanelBody;
