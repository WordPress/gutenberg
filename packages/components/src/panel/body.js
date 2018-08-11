/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

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
		if ( this.props.opened === undefined ) {
			this.setState( ( state ) => ( {
				opened: ! state.opened,
			} ) );
		}

		if ( this.props.onToggle ) {
			this.props.onToggle();
		}
	}

	render() {
		const { title, children, opened, className, icon } = this.props;
		const isOpened = opened === undefined ? this.state.opened : opened;
		const classes = classnames( 'components-panel__body', className, { 'is-opened': isOpened } );

		return (
			<div className={ classes }>
				{ !! title && (
					<h2 className="components-panel__body-title">
						<Button
							className="components-panel__body-toggle"
							onClick={ this.toggle }
							aria-expanded={ isOpened }
						>
							{ isOpened ?
								<svg className="components-panel__arrow" version="1.1" x="0px" y="0px" width="24px" height="24px" viewBox="0 0 24 24" enableBackground="new 0 0 24 24" xmlSpace="preserve">
									<g><path fill="none" d="M0,0h24v24H0V0z" /></g>
									<g><path d="M12,8l-6,6l1.41,1.41L12,10.83l4.59,4.58L18,14L12,8z" /></g>
								</svg> :
								<svg
									className="components-panel__arrow" version="1.1" x="0px" y="0px" width="24px" height="24px" viewBox="0 0 24 24" enableBackground="new 0 0 24 24" xmlSpace="preserve">
									<g><path fill="none" d="M0,0h24v24H0V0z" /></g>
									<g><path d="M7.41,8.59L12,13.17l4.59-4.58L18,10l-6,6l-6-6L7.41,8.59z" /></g>
								</svg>
							}
							{ icon && <Dashicon icon={ icon } className="components-panel__icon" /> }
							{ title }
						</Button>
					</h2>
				) }
				{ isOpened && children }
			</div>
		);
	}
}

export default PanelBody;
