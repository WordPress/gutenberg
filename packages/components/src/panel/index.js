/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PanelHeader from './header';

function Panel( { header, className, children }, ref ) {
	const classNames = classnames( className, 'components-panel' );
	return (
		<div className={ classNames } ref={ ref }>
			{ header && <PanelHeader label={ header } /> }
			{ children }
		</div>
	);
}

export default forwardRef( Panel );
