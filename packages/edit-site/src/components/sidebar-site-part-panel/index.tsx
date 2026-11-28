import { Page } from '@wordpress/admin-ui';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { MediaEdit } from '@wordpress/fields';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { unlock } from '../../lock-unlock';

const { useLocation } = unlock( routerPrivateApis );
const {
	SitePartPanelContent,
	SitePartSyncedNotice,
	getSitePartPanelTitle,
	useSitePart,
} = unlock( editorPrivateApis );

/**
 * The open Site parts panel, beside the area's sidebar screen.
 */
export default function SidebarSitePartPanel() {
	const {
		params: { area },
		query: { panel },
	} = useLocation();
	const { contents } = useSitePart( area );
	const title = getSitePartPanelTitle( panel, contents );

	if ( ! title ) {
		return null;
	}

	return (
		<Page title={ title } headingLevel={ 2 }>
			<div className="edit-site-sidebar-site-part-panel">
				<SitePartSyncedNotice area={ area } panel={ panel } />
				<SitePartPanelContent
					area={ area }
					panel={ panel }
					MediaEdit={ MediaEdit }
				/>
			</div>
		</Page>
	);
}
