import { __ } from '@wordpress/i18n';
import { useGlobalStylesRevisions } from '@wordpress/global-styles-ui';
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import SidebarNavigationScreenDetailsFooter from '../sidebar-navigation-screen-details-footer';
import { MainSidebarNavigationContent } from '../sidebar-navigation-screen-main';
import useOpenGlobalStylesRevisions from './use-open-global-styles-revisions';

export default function SidebarNavigationScreenGlobalStyles() {
	const {
		revisions,
		isLoading: isLoadingRevisions,
		revisionsCount,
	} = useGlobalStylesRevisions();
	const { openRevisions } = useOpenGlobalStylesRevisions();

	// If there are no revisions, do not render a footer.
	const shouldShowGlobalStylesFooter =
		!! revisionsCount && ! isLoadingRevisions;

	return (
		<>
			<SidebarNavigationScreen
				title={ __( 'Design' ) }
				isRoot
				description={ __(
					'Customize the appearance of your website using the block editor.'
				) }
				content={ <MainSidebarNavigationContent /> }
				footer={
					shouldShowGlobalStylesFooter && (
						<SidebarNavigationScreenDetailsFooter
							record={ revisions?.[ 0 ] }
							revisionsCount={ revisionsCount }
							onClick={ openRevisions }
						/>
					)
				}
			/>
		</>
	);
}
