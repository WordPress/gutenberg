/**
 * WordPress dependencies
 */
import { Dashicon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const warning = (
	<div className="editor-visual-editor__invalid-block-warning">
		<Dashicon icon="warning" />
		<p>{ __(
			'This block has been modified externally and has been locked to ' +
			'protect against content loss.'
		) }</p>
	</div>
);

export default () => warning;
