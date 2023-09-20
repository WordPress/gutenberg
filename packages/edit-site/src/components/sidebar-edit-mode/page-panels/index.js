/**
 * WordPress dependencies
 */
import {
	PanelBody,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
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
import PageSummary from './page-summary';
import PageActions from './page-actions';

export default function PagePanels() {
	const { page, hasResolved } = useSelect( ( select ) => {
		const { getEditedPostContext } = select( editSiteStore );
		const { getEditedEntityRecord, hasFinishedResolution } =
			select( coreStore );
		const context = getEditedPostContext();
		const queryArgs = [ 'postType', context.postType, context.postId ];
		const record = getEditedEntityRecord( ...queryArgs );
		return {
			hasResolved: hasFinishedResolution(
				'getEditedEntityRecord',
				queryArgs
			),
			page: record,
		};
	}, [] );

	const { id, type, status, date, password, title, modified } = page;

	if ( ! hasResolved ) {
		return null;
	}

	return (
		<>
			<PanelBody>
				<SidebarCard
					title={ decodeEntities( title ) }
					icon={ pageIcon }
					actions={ <PageActions page={ page } /> }
					description={
						<VStack>
							<Text>
								{ sprintf(
									// translators: %s: Human-readable time difference, e.g. "2 days ago".
									__( 'Last edited %s' ),
									humanTimeDiff( modified )
								) }
							</Text>
						</VStack>
					}
				/>
			</PanelBody>
			<PanelBody title={ __( 'Summary' ) }>
				<PageSummary
					status={ status }
					date={ date }
					password={ password }
					postId={ id }
					postType={ type }
				/>
			</PanelBody>
			<PanelBody title={ __( 'Content' ) }>
				<PageContent />
			</PanelBody>
		</>
	);
}
