/**
 * External dependencies
 */
import { isString, noop } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import IconButton from '../icon-button';

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
				<IconButton
					className="components-notice__dismiss"
					icon="no"
					label={ __( 'Dismiss this notice' ) }
					onClick={ onRemove }
					tooltip={ false }
				/>
			) }
		</div>
	);
}

export default Notice;
