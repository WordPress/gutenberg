/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Card, Link, Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import EventsSection from './events-section';
import NewsSection from './news-section';
import styles from './style.module.css';

// ─── Main component ───────────────────────────────────────────────────────────

export default function EventsNews() {
	return (
		<Card.Content>
			<EventsSection />
			<NewsSection />
			<Stack
				direction="row"
				align="center"
				gap="sm"
				className={ styles.footer }
			>
				<Link
					href="https://make.wordpress.org/community/meetups-landing-page"
					openInNewTab
				>
					{ __( 'Meetups' ) }
				</Link>
				<Link
					href="https://central.wordcamp.org/schedule/"
					openInNewTab
				>
					{ __( 'WordCamps' ) }
				</Link>
				<Link
					href={ _x(
						'https://wordpress.org/news/',
						'Events and News dashboard widget'
					) }
					openInNewTab
				>
					{ __( 'News' ) }
				</Link>
			</Stack>
		</Card.Content>
	);
}
