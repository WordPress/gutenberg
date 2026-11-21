import { Breadcrumbs, Page } from '@wordpress/admin-ui';

export const stage = () => (
	<Page
		ariaLabel="Settings"
		breadcrumbs={ <Breadcrumbs items={ [ { label: 'Settings' } ] } /> }
	>
		Settings content
	</Page>
);
