/**
 * WordPress dependencies
 */
import { __experimentalText as Text } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { humanTimeDiff } from '@wordpress/date';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export default function PostLastEditedPanel() {
	const modified = useSelect(
		( select ) =>
			select( editorStore ).getEditedPostAttribute( 'modified' ),
		[]
	);
	const lastEditedText =
		modified &&
		sprintf(
			// translators: %s: Human-readable time difference, e.g. "2 days ago".
			__( 'Last edited %s.' ),
			humanTimeDiff( modified )
		);
	if ( ! lastEditedText ) {
		return null;
	}
	return (
		<div className="editor-post-last-edited-panel">
			<Text>{ lastEditedText }</Text>
		</div>
	);
}
