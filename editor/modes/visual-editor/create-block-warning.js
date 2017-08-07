/**
 * WordPress dependencies
 */
import { Dashicon } from '@wordpress/components';

export default ( text ) => (
	<div className="editor-visual-editor__block-warning">
		<Dashicon icon="warning" />
		<p>{ text }</p>
	</div>
);
