import { Breadcrumbs, Page } from '@wordpress/admin-ui';
import { Link } from '@wordpress/route';

export const stage = () => (
	<Page
		ariaLabel="General"
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
	</Page>
);
