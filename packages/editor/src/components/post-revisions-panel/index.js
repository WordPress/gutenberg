/**
 * WordPress dependencies
 */
import {
	PanelBody,
	Button,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PostLastRevisionCheck from '../post-last-revision/check';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { Badge: WCBadge } = unlock( componentsPrivateApis );

function PostRevisionsPanelContent() {
	const { setCurrentRevisionId } = unlock( useDispatch( editorStore ) );
	const { revisionsCount, lastRevisionId } = useSelect( ( select ) => {
		const { getCurrentPostRevisionsCount, getCurrentPostLastRevisionId } =
			select( editorStore );
		return {
			revisionsCount: getCurrentPostRevisionsCount(),
			lastRevisionId: getCurrentPostLastRevisionId(),
		};
	}, [] );
	return (
		<PanelBody
			title={
				<HStack justify="space-between" align="center" as="span">
					<span>{ __( 'Revisions' ) }</span>
					<WCBadge className="editor-post-revisions-panel__revisions-count">
						{ revisionsCount }
					</WCBadge>
				</HStack>
			}
			initialOpen={ false }
		>
			<VStack className="editor-post-revisions-panel">
				<Button
					className="editor-post-revisions-panel__view-all"
					__next40pxDefaultSize
					variant="secondary"
					onClick={ () => setCurrentRevisionId( lastRevisionId ) }
				>
					{ __( 'View all revisions' ) }
				</Button>
			</VStack>
		</PanelBody>
	);
}

export default function PostRevisionsPanel() {
	const disableVisualRevisions = useSelect(
		( select ) =>
			!! select( editorStore ).getEditorSettings().disableVisualRevisions,
		[]
	);
	if ( disableVisualRevisions ) {
		return null;
	}
	return (
		<PostLastRevisionCheck>
			<PostRevisionsPanelContent />
		</PostLastRevisionCheck>
	);
}
