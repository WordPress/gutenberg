/**
 * External dependencies
 */
import classnames from 'classnames';
import { isString } from 'lodash';

/**
 * WordPress dependencies
 */
import { cloneElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import Button from '../button';
import Shortcut from './shortcut';
import IconButton from '../icon-button';

/**
 * Renders a generic menu item for use inside the more menu.
 *
 * @return {WPElement} More menu item.
 */
function MenuItem( { className, icon, label, onClick, shortcut, isSelected = false } ) {
	className = classnames( 'components-menu-item__button', {
		[ className ]: Boolean( className ),
		'has-icon': icon,
	} );

	if ( icon ) {
		if ( ! isString( icon ) ) {
			icon = cloneElement( icon, {
				className: 'components-menu-items__item-icon',
				height: 20,
				width: 20,
			} );
		}

		return (
			<IconButton
				className={ className }
				icon={ icon }
				onClick={ onClick }
				aria-pressed={ isSelected }
			>
				{ label }
				<Shortcut shortcut={ shortcut } />
			</IconButton>
		);
	}

	return (
		<Button
			className={ className }
			onClick={ onClick }
			aria-pressed={ isSelected }
		>
			{ label }
			<Shortcut shortcut={ shortcut } />
		</Button>
	);
}

export default MenuItem;
