/**
 * External dependencies
 */
import { isString, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';

/**
 * Internal Dependencies
 */
import './style.scss';

function Notice( { status, content, onRemove = noop } ) {
	const className = `notice notice-alt is-dismissible notice-${ status }`;
	return (
		<div className={ className }>
			{ isString( content ) ? <p>{ content }</p> : content }
			<button className="notice-dismiss" type="button" onClick={ onRemove }>
				<span className="screen-reader-text">{ __( 'Dismiss this notice' ) }</span>
			</button>
		</div>
	);
}

export default Notice;
