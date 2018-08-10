/**
 * External dependencies
 */
import { isString, noop } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { IconButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function Notice( { className, status, children, onRemove = noop, isDismissible = true } ) {
	const classNames = classnames( className, 'components-notice components-notice--' + status, {
		'is-dismissible': isDismissible,
	} );
	return (
		<div className={ classNames }>
			{ isString( children ) ? <div className="components-notice__content">{ children }</div> : children }
			{ isDismissible && (
				<IconButton icon="no-alt" className="components-notice__dismiss" onClick={ onRemove }>
					<span className="screen-reader-text">{ __( 'Dismiss this notice' ) }</span>
				</IconButton>
			) }
		</div>
	);
}

export default Notice;
