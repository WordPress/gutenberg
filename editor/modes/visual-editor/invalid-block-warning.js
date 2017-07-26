/**
 * WordPress dependencies
 */
import { Dashicon } from 'components';
import { __ } from 'i18n';

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
