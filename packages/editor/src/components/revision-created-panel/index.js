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

export default function RevisionCreatedPanel() {
	const date = useSelect( ( select ) => {
		const { getCurrentRevision } = unlock( select( editorStore ) );
		return getCurrentRevision()?.date;
	}, [] );

	if ( ! date ) {
		return null;
	}

	return (
		<div className="editor-post-last-edited-panel">
			<Text>
				{ sprintf(
					// translators: %s: Human-readable time difference, e.g. "2 days ago".
					__( 'Created %s.' ),
					humanTimeDiff( date )
				) }
			</Text>
		</div>
	);
}
