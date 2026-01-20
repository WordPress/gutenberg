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
import { unlock } from '../../lock-unlock';

export default function PostLastEditedPanel() {
	const { date, isRevision } = useSelect( ( select ) => {
		const { getEditedPostAttribute, getCurrentRevision, isRevisionsMode } =
			unlock( select( editorStore ) );
		const _isRevisionMode = isRevisionsMode();
		return {
			isRevision: _isRevisionMode,
			date: _isRevisionMode
				? getCurrentRevision()?.date
				: getEditedPostAttribute( 'modified' ),
		};
	}, [] );
	if ( ! date ) {
		return null;
	}
	const text = isRevision
		? // translators: %s: Human-readable time difference, e.g. "2 days ago".
		  __( 'Created %s.' )
		: // translators: %s: Human-readable time difference, e.g. "2 days ago".
		  __( 'Last edited %s.' );
	return (
		<div className="editor-post-last-edited-panel">
			<Text>{ sprintf( text, humanTimeDiff( date ) ) }</Text>
		</div>
	);
}
