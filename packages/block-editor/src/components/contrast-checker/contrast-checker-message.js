/**
 * WordPress dependencies
 */
import { Notice } from '@wordpress/components';

export default function ContrastCheckerMessage( { message } ) {
	return (
		<div className="block-editor-contrast-checker">
			<Notice
				spokenMessage={ null }
				status="warning"
				isDismissible={ false }
			>
				{ message }
			</Notice>
		</div>
	);
}
