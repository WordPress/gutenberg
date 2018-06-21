/**
 * WordPress dependencies
 */
import { Tooltip, Dashicon } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';

function SharedBlockIndicator( { title } ) {
	// translators: %s: title/name of the shared block
	const tooltipText = sprintf( __( 'Shared Block: %s' ), title );
	return (
		<Tooltip text={ tooltipText }>
			<span className="shared-block-indicator">
				<Dashicon icon="controls-repeat" />
			</span>
		</Tooltip>
	);
}

export default withSelect( ( select ) => {
	const { getEditedPostAttribute } = select( 'core/editor' );

	return {
		title: getEditedPostAttribute( 'title' ),
	};
} )( SharedBlockIndicator );
