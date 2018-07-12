/**
 * WordPress dependencies
 */
import { Tooltip, Dashicon } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { withSelect } from '@wordpress/data';

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

export default withSelect( ( select ) => {
	const { getEditedPostAttribute } = select( 'core/editor' );

	return {
		title: getEditedPostAttribute( 'title' ),
	};
} )( ReusableBlockIndicator );
