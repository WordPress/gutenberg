/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Link, Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { NewsList } from './components';

export default function WordPressNews() {
	return (
		<Stack direction="column" justify="start" gap="md">
			<NewsList />
			<Link
				href={ _x(
					'https://wordpress.org/news/all-posts/',
					'News dashboard widget'
				) }
				openInNewTab
			>
				{ __( 'See all' ) }
			</Link>
		</Stack>
	);
}
