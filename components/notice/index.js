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
 * Internal Dependencies
 */
import './style.scss';

function Notice( { status, content, onRemove = noop, isDismissible = true } ) {
	const className = classnames( 'notice notice-alt notice-' + status, {
		'is-dismissible': isDismissible,
	} );
	return (
		<div className={ className }>
			{ isString( content ) ? <p>{ content }</p> : content }
			{ isDismissible && (
				<button className="notice-dismiss" type="button" onClick={ onRemove }>
					<span className="screen-reader-text">{ __( 'Dismiss this notice' ) }</span>
				</button>
			) }
		</div>
	);
}

export default Notice;
