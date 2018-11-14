/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../button';
import Icon from '../icon';
import { G, Path, SVG } from '../primitives';

export class PanelBody extends Component {
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
		const { title, children, opened, className, icon, forwardedRef } = this.props;
		const isOpened = opened === undefined ? this.state.opened : opened;
		const classes = classnames( 'components-panel__body', className, { 'is-opened': isOpened } );

		return (
			<div className={ classes } ref={ forwardedRef }>
				{ !! title && (
					<h2 className="components-panel__body-title">
						<Button
							className="components-panel__body-toggle"
							onClick={ this.toggle }
							aria-expanded={ isOpened }
						>
							{ /*
								Firefox + NVDA don't announce aria-expanded because the browser
								repaints the whole element, so this wrapping span hides that.
							*/ }
							<span aria-hidden="true">
								{ isOpened ?
									<SVG className="components-panel__arrow" width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
										<G><Path fill="none" d="M0,0h24v24H0V0z" /></G>
										<G><Path d="M12,8l-6,6l1.41,1.41L12,10.83l4.59,4.58L18,14L12,8z" /></G>
									</SVG> :
									<SVG className="components-panel__arrow" width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
										<G><Path fill="none" d="M0,0h24v24H0V0z" /></G>
										<G><Path d="M7.41,8.59L12,13.17l4.59-4.58L18,10l-6,6l-6-6L7.41,8.59z" /></G>
									</SVG>
								}
							</span>
							{ title }
							{ icon && <Icon icon={ icon } className="components-panel__icon" size={ 20 } /> }
						</Button>
					</h2>
				) }
				{ isOpened && children }
			</div>
		);
	}
}

const forwardedPanelBody = ( props, ref ) => {
	return <PanelBody { ...props } forwardedRef={ ref } />;
};
forwardedPanelBody.displayName = 'PanelBody';

export default forwardRef( forwardedPanelBody );
