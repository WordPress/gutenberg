import { __ } from '@wordpress/i18n';
import Warning from '../warning';

const warning = (
	<Warning className="block-editor-block-list__block-crash-warning">
		{ __( 'This block has encountered an error and cannot be previewed.' ) }
	</Warning>
);

export default function BlockCrashWarning() {
	return warning;
}
