/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import type { ReactNode } from 'react';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { Tabs } = unlock( componentsPrivateApis );

interface LayoutProps {
	activeTab: 'post-types' | 'taxonomies';
	children: ReactNode;
}

export function Layout( { activeTab, children }: LayoutProps ) {
	const navigate = useNavigate();

	return (
		<Page
			ariaLabel={ __( 'Content Types' ) }
			className="content-types-page"
		>
			<Tabs
				selectedTabId={ activeTab }
				onSelect={ ( tabId: string ) =>
					navigate( { to: `/${ tabId }` } )
				}
			>
				<div className="content-types-tabs-wrapper">
					<Tabs.TabList>
						<Tabs.Tab tabId="post-types">
							{ __( 'Post Types' ) }
						</Tabs.Tab>
						<Tabs.Tab tabId="taxonomies">
							{ __( 'Taxonomies' ) }
						</Tabs.Tab>
					</Tabs.TabList>
				</div>
			</Tabs>
			{ children }
		</Page>
	);
}
