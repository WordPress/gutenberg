/**
 * WordPress dependencies
 */
import { TabPanel } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DefaultSidebar from './default-sidebar';
import BlockPanel from './block-panel';
import GlobalPanel from './global-panel';

export default ( { identifier, title: panelTitle, icon } ) => {
	return (
		<DefaultSidebar
			identifier={ identifier }
			title={ panelTitle }
			icon={ icon }
		>
			<TabPanel
				tabs={ [
					{ name: 'global', title: __( 'Global' ) },
					{ name: 'block', title: __( 'By Block Type' ) },
				] }
			>
				{ ( tab ) => {
					if ( 'block' === tab.name ) {
						return <BlockPanel />;
					}
					return <GlobalPanel />;
				} }
			</TabPanel>
		</DefaultSidebar>
	);
};
