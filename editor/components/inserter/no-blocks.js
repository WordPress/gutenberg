/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

function NoBlocks() {
	return (
		<span className="editor-inserter__no-blocks">
			{ __( 'No blocks found' ) }
		</span>
	);
}

export default NoBlocks;
