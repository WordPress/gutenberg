/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';
import { page as pageIcon } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';
import { humanTimeDiff } from '@wordpress/date';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import SidebarCard from '../sidebar-card';
import PageContent from './page-content';
import EditTemplate from './edit-template';

export default function PagePanels() {
	const { hasResolved, title, modified } = useSelect( ( select ) => {
		const { getEditedPostContext } = select( editSiteStore );
		const { getEditedEntityRecord, hasFinishedResolution } =
			select( coreStore );
		const context = getEditedPostContext();
		const queryArgs = [ 'postType', context.postType, context.postId ];
		const page = getEditedEntityRecord( ...queryArgs );
		return {
			hasResolved: hasFinishedResolution(
				'getEditedEntityRecord',
				queryArgs
			),
			title: page?.title,
			modified: page?.modified,
		};
	}, [] );

	if ( ! hasResolved ) {
		return null;
	}

	return (
		<>
			<PanelBody>
				<SidebarCard
					title={ decodeEntities( title ) }
					icon={ pageIcon }
					description={ sprintf(
						// translators: %s: Human-readable time difference, e.g. "2 days ago".
						__( 'Last edited %s' ),
						humanTimeDiff( modified )
					) }
				/>
			</PanelBody>
			<PanelBody title={ __( 'Content' ) }>
				<PageContent />
			</PanelBody>
			<PanelBody title={ __( 'Template' ) }>
				<EditTemplate />
			</PanelBody>
		</>
	);
}
