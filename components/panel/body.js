/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from '../button';
import Dashicon from '../dashicon';

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
		this.setState( ( state ) => ( {
			opened: ! state.opened,
		} ) );
	}

	render() {
		const { title, children } = this.props;
		const { opened } = this.state;
		const icon = `arrow-${ opened ? 'down' : 'right' }`;
		const className = classnames( 'components-panel__body', { 'is-opened': opened } );

		return (
			<div className={ className }>
				{ !! title && (
					<h3 className="components-panel__body-title">
						<Button
							className="components-panel__body-toggle"
							onClick={ this.toggle }
							aria-expanded={ opened }
							label={ sprintf( __( 'Open section: %s' ), title ) }
						>
							<Dashicon icon={ icon } />
							{ title }
						</Button>
					</h3>
				) }
				{ this.state.opened && children }
			</div>
		);
	}
}

export default PanelBody;
