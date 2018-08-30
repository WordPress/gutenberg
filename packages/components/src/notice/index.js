/**
 * External dependencies
 */
import { noop } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import withSpokenMessages from '../higher-order/with-spoken-messages';

/**
 * Internal dependencies
 */
import IconButton from '../icon-button';

function Notice( {
	className,
	status,
	children,
	onRemove = noop,
	isDismissible = true,
	spokenMessage,
	speak,
} ) {
	const classNames = classnames( className, 'components-notice', {
		[ `is-${ status }` ]: ! ! status,
	}, {
		'is-dismissible': isDismissible,
	} );

	const message = spokenMessage || children;
	speak( message, 'assertive' );

	return (
		<div className={ classNames }>
			<div className="components-notice__content">{ children }</div>
			{ isDismissible && (
				<IconButton
					className="components-notice__dismiss"
					icon="no"
					label={ __( 'Dismiss this notice' ) }
					onClick={ onRemove }
				/>
			) }
		</div>
	);
}

export default withSpokenMessages( Notice );
