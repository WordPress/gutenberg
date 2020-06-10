/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { forwardRef, useState } from '@wordpress/element';
import { chevronUp, chevronDown } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Button from '../button';
import Icon from '../icon';

export function PanelBody( {
	title,
	children,
	opened,
	className,
	icon,
	forwardedRef,
	initialOpen,
	onToggle,
} ) {
	const [ isOpenedState, setOpenedState ] = useState(
		initialOpen === undefined ? true : initialOpen
	);
	const isOpened = opened === undefined ? isOpenedState : opened;

	const classes = classnames( 'components-panel__body', className, {
		'is-opened': isOpened,
	} );

	const toggle = ( event ) => {
		event.preventDefault();
		if ( opened === undefined ) {
			setOpenedState( ! isOpenedState );
		}

		if ( onToggle ) {
			onToggle();
		}
	};

	return (
		<div className={ classes } ref={ forwardedRef }>
			{ !! title && (
				<h2 className="components-panel__body-title">
					<Button
						className="components-panel__body-toggle"
						onClick={ toggle }
						aria-expanded={ isOpened }
					>
						{ /*
							Firefox + NVDA don't announce aria-expanded because the browser
							repaints the whole element, so this wrapping span hides that.
						*/ }
						<span aria-hidden="true">
							<Icon
								className="components-panel__arrow"
								icon={ isOpened ? chevronUp : chevronDown }
							/>
						</span>
						{ title }
						{ icon && (
							<Icon
								icon={ icon }
								className="components-panel__icon"
								size={ 20 }
							/>
						) }
					</Button>
				</h2>
			) }
			{ isOpened && children }
		</div>
	);
}

const forwardedPanelBody = ( props, ref ) => {
	return <PanelBody { ...props } forwardedRef={ ref } />;
};
forwardedPanelBody.displayName = 'PanelBody';

export default forwardRef( forwardedPanelBody );
