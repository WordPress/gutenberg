/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PostPanelRow from '../post-panel-row';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

export default function RevisionAuthorPanel() {
	const authorName = useSelect( ( select ) => {
		const { getCurrentRevision } = unlock( select( editorStore ) );
		const revision = getCurrentRevision();
		if ( ! revision?.author ) {
			return null;
		}
		const author = select( coreStore ).getUser( revision.author );
		return author?.name;
	}, [] );

	if ( ! authorName ) {
		return null;
	}

	return (
		<PostPanelRow label={ __( 'Author' ) }>
			{ decodeEntities( authorName ) }
		</PostPanelRow>
	);
}
