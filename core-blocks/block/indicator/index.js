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
	// translators: %s: title/name of the reusable block
	const tooltipText = sprintf( __( 'Reusable Block: %s' ), title );
	return (
		<Tooltip text={ tooltipText }>
			<span className="reusable-block-indicator">
				<Dashicon icon="controls-repeat" />
			</span>
		</Tooltip>
	);
}

export default ReusableBlockIndicator;
