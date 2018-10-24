/**
 * External dependencies
 */
import { includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { Panel, PanelBody } from '@wordpress/components';
import { compose, ifCondition } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { BlockInspector } from '@wordpress/editor';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal Dependencies
 */
import Sidebar from '../';
import SettingsHeader from '../settings-header';
import PostStatus from '../post-status';
import LastRevision from '../last-revision';
import PostTaxonomies from '../post-taxonomies';
import FeaturedImage from '../featured-image';
import PostExcerpt from '../post-excerpt';
import DiscussionPanel from '../discussion-panel';
import PageAttributes from '../page-attributes';
import MetaBoxes from '../../meta-boxes';

const SIDEBAR_NAME_BLOCK = 'edit-post/block';
const SIDEBAR_NAME_DOCUMENT = 'edit-post/document';

const SettingsSidebar = ( { sidebarName } ) => (
	<Sidebar
		name={ sidebarName }
		label={ __( 'Editor settings' ) }
	>
		<SettingsHeader sidebarName={ sidebarName } />
		<Panel>
			{ sidebarName === SIDEBAR_NAME_DOCUMENT && (
				<Fragment>
					<PostStatus />
					<LastRevision />
					<PostTaxonomies />
					<FeaturedImage />
					<PostExcerpt />
					<DiscussionPanel />
					<PageAttributes />
					<MetaBoxes location="side" />
				</Fragment>
			) }
			{ sidebarName === SIDEBAR_NAME_BLOCK && (
				<PanelBody className="edit-post-settings-sidebar__panel-block">
					<BlockInspector />
				</PanelBody>
			) }
		</Panel>
	</Sidebar>
);

export default compose(
	withSelect( ( select ) => {
		return {
			sidebarName: select( 'core/edit-post' ).getActiveGeneralSidebarName(),
		};
	} ),
	ifCondition( ( { sidebarName } ) => {
		return includes( [ SIDEBAR_NAME_BLOCK, SIDEBAR_NAME_DOCUMENT ], sidebarName );
	} )
)( SettingsSidebar );
