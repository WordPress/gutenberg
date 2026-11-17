import { Breadcrumbs, Page } from '@wordpress/admin-ui';
import { SECTIONS, SectionLink } from './section-navigation';

export const stage = () => (
	<Page
		ariaLabel="Settings"
		breadcrumbs={ <Breadcrumbs items={ [ { label: 'Settings' } ] } /> }
		navigation={ { items: SECTIONS, currentHref: '/settings' } }
		components={ { link: SectionLink } }
	>
		Settings content
	</Page>
);
