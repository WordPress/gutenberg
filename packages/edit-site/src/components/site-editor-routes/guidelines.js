/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import Editor from '../editor';
import { unlock } from '../../lock-unlock';
import SidebarNavigationScreenGuidelines from '../sidebar-navigation-screen-guidelines';
import SidebarContentGuidelines from '../sidebar-content-guidelines';

const { useLocation } = unlock( routerPrivateApis );

function MobileGuidelinesUI() {
	const { query = {} } = useLocation();
	const { canvas } = query;

	if ( canvas === 'edit' ) {
		return <Editor />;
	}

	return <SidebarContentGuidelines />;
}

function GuidelinesPreviewArea() {
	return <Editor />;
}

/**
 * Check if Content Guidelines experiment is enabled.
 *
 * @return {boolean} Whether the experiment is enabled.
 */
export function useIsContentGuidelinesEnabled() {
	return useSelect( ( select ) => {
		const settings = select( coreStore ).getEntityRecord(
			'root',
			'__unstableBase'
		);
		return settings?.contentGuidelinesEnabled ?? false;
	}, [] );
}

export const guidelinesRoute = {
	name: 'guidelines',
	path: '/guidelines',
	areas: {
		content: <SidebarContentGuidelines />,
		sidebar: <SidebarNavigationScreenGuidelines backPath="/" />,
		preview: <GuidelinesPreviewArea />,
		mobile: <MobileGuidelinesUI />,
	},
	widths: {
		content: 380,
	},
};
