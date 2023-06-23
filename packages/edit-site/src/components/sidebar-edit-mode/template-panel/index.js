/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { PanelRow, PanelBody } from '@wordpress/components';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { navigation as navigationIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import TemplateActions from './template-actions';
import TemplateAreas from './template-areas';
import LastRevision from './last-revision';
import SidebarCard from '../sidebar-card';

export default function TemplatePanel() {
	const {
		info: { title, description, icon },
		record,
	} = useSelect( ( select ) => {
		const { getEditedPostType, getEditedPostId } = select( editSiteStore );
		const { getEditedEntityRecord } = select( coreStore );
		const { __experimentalGetTemplateInfo: getTemplateInfo } =
			select( editorStore );

		const postType = getEditedPostType();
		const postId = getEditedPostId();
		const _record = getEditedEntityRecord( 'postType', postType, postId );

		const info = _record ? getTemplateInfo( _record ) : {};

		return { info, record: _record };
	}, [] );

	if ( ! title && ! description ) {
		return null;
	}

	return (
		<PanelBody className="edit-site-template-panel">
			<SidebarCard
				className="edit-site-template-card"
				title={ decodeEntities( title ) }
				icon={
					record?.type === 'wp_navigation' ? navigationIcon : icon
				}
				description={ decodeEntities( description ) }
				actions={ <TemplateActions template={ record } /> }
			>
				<TemplateAreas />
			</SidebarCard>
			<PanelRow
				header={ __( 'Editing history' ) }
				className="edit-site-template-revisions"
			>
				<LastRevision />
			</PanelRow>
		</PanelBody>
	);
}
