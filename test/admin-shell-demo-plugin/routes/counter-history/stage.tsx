import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { Link as RouteLink } from '@wordpress/route';

function Stage() {
	return (
		<Page
			title={ __( 'Counter history' ) }
			subTitle={ __(
				'A second route on the Counter page. Switch pages and come back: you return to this route.'
			) }
			hasPadding
		>
			<RouteLink to="/">{ __( 'Back to the counter' ) }</RouteLink>
		</Page>
	);
}

export const stage = Stage;
