import { Breadcrumbs, Page } from '@wordpress/admin-ui';
import { Link } from '@wordpress/route';
import { SECTIONS, SectionLink } from './section-navigation';

export const stage = () => (
	<Page
		ariaLabel="General"
		navigation={ { items: SECTIONS, currentHref: '/settings/general' } }
		components={ { link: SectionLink } }
		breadcrumbs={
			<Breadcrumbs
				items={ [
					{ label: 'Settings', to: '/settings' },
					{ label: 'General' },
				] }
			/>
		}
	>
		<Link to="/settings/general" search={ { tab: 'advanced' } }>
			Advanced
		</Link>
		<Link to="/own-focus">Own focus</Link>
	</Page>
);
