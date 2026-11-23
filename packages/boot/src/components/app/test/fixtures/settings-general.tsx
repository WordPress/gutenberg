import type { ComponentPropsWithoutRef } from 'react';
import { Page } from '@wordpress/admin-ui';
import { Link } from '@wordpress/route';

function RouterLink( {
	href,
	...props
}: ComponentPropsWithoutRef< 'a' > & { href: string } ) {
	return <Link to={ href } { ...props } />;
}

export const stage = () => (
	<Page
		breadcrumbs={ [
			{ label: 'Settings', href: '/settings' },
			{ label: 'General' },
		] }
		components={ { link: RouterLink } }
	>
		<Link to="/settings/general" search={ { tab: 'advanced' } }>
			Advanced
		</Link>
		<Link to="/own-focus">Own focus</Link>
	</Page>
);
