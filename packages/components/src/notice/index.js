/**
 * External dependencies
 */
import { isString, noop } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import Dashicon from '../dashicon';
import { __ } from '@wordpress/i18n';

function Notice( { className, status, children, onRemove = noop, isDismissible = true } ) {
	const classNames = classnames( className, 'components-notice', {
		[ `is-${ status }` ]: ! ! status,
	}, {
		'is-dismissible': isDismissible,
	} );
	return (
		<div className={ classNames }>
			{ isString( children ) ? <div className="components-notice__content">{ children }</div> : children }
			{ isDismissible && (
				<button className="components-notice__dismiss" type="button" onClick={ onRemove }>
					<Dashicon icon="no" />
					<span className="screen-reader-text">{ __( 'Dismiss this notice' ) }</span>
				</button>
			) }
		</div>
	);
}

export default Notice;
