/**
 * WordPress dependencies
 */
import { Tooltip, Dashicon } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';

function ReusableBlockIndicator( { title } ) {
	return (
		<Tooltip text={ sprintf( __( 'Shared Block: %s' ), title ) }>
			<span className="reusable-block-indicator">
				<Dashicon icon="controls-repeat" />
			</span>
		</Tooltip>
	);
}

export default ReusableBlockIndicator;
