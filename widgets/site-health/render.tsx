import { useState, useEffect } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { Spinner } from '@wordpress/components';
import { Link, Stack, Text } from '@wordpress/ui';
import { useWidgetHost } from '@wordpress/widget-primitives';
import { CircleProgress, type HealthTone } from './components';
import styles from './style.module.css';

type TestStatus = 'good' | 'recommended' | 'critical';

type TestResult = {
	status: TestStatus;
};

type IssueCounts = {
	good: number;
	recommended: number;
	critical: number;
};

// Async site health tests exposed via the REST API. The Site Health page
// reads the same set; keep `routes/site-health/stage.tsx` in sync.
const ASYNC_TEST_PATHS = [
	'/wp-site-health/v1/tests/background-updates',
	'/wp-site-health/v1/tests/loopback-requests',
	'/wp-site-health/v1/tests/https-status',
	'/wp-site-health/v1/tests/dotorg-communication',
	'/wp-site-health/v1/tests/authorization-header',
	'/wp-site-health/v1/tests/page-cache',
] as const;

/**
 * Maps a percentage to a semantic tone used for CSS class selection.
 *
 * @param {number} pct Percentage of passing tests (0-100).
 */
function toneForPercentage( pct: number ): HealthTone {
	if ( pct === 100 ) {
		return 'success';
	}
	if ( pct >= 75 ) {
		return 'warning';
	}
	return 'error';
}

/**
 * Returns the human-readable status message matching the PHP widget logic.
 *
 * @param {IssueCounts} counts Aggregated issue counts.
 */
function statusMessage( counts: IssueCounts ): string {
	const total = counts.recommended + counts.critical;

	if ( total <= 0 ) {
		return __(
			'Great job! Your site currently passes all site health checks.'
		);
	}

	if ( counts.critical === 1 ) {
		return __(
			'Your site has a critical issue that should be addressed as soon as possible to improve its performance and security.'
		);
	}

	if ( counts.critical > 1 ) {
		return __(
			'Your site has critical issues that should be addressed as soon as possible to improve its performance and security.'
		);
	}

	if ( counts.recommended === 1 ) {
		return __(
			'Your site\u2019s health is looking good, but there is still one thing you can do to improve its performance and security.'
		);
	}

	return __(
		'Your site\u2019s health is looking good, but there are still some things you can do to improve its performance and security.'
	);
}

/**
 * Builds the href of the dashboard's Site Health page, the same target as
 * the Details action, filtered to the statuses that have items. The query
 * travels inside `p`, so a full load and the host's route link read the
 * same filter.
 *
 * @param {IssueCounts} counts Aggregated issue counts.
 */
function reviewHref( counts: IssueCounts ): string {
	const statuses = ( [ 'critical', 'recommended' ] as const ).filter(
		( status ) => counts[ status ] > 0
	);
	const route = `/site-health?status=${ statuses.join( ',' ) }`;

	return `admin.php?page=dashboard-wp-admin&p=${ encodeURIComponent(
		route
	) }`;
}

export default function SiteHealth() {
	const [ counts, setCounts ] = useState< IssueCounts | null >( null );
	const [ isLoading, setIsLoading ] = useState( true );
	const { links } = useWidgetHost();

	useEffect( () => {
		let ignore = false;

		const requests = ASYNC_TEST_PATHS.map( ( path ) =>
			apiFetch< TestResult >( { path } ).catch( () => null )
		);

		Promise.all( requests ).then( ( results ) => {
			if ( ignore ) {
				return;
			}

			const totals: IssueCounts = {
				good: 0,
				recommended: 0,
				critical: 0,
			};

			for ( const result of results ) {
				if ( result?.status && result.status in totals ) {
					totals[ result.status ]++;
				}
			}

			setCounts( totals );
			setIsLoading( false );
		} );

		return () => {
			ignore = true;
		};
	}, [] );

	if ( isLoading ) {
		return (
			<Stack
				className={ styles.loading }
				direction="column"
				align="center"
				justify="center"
			>
				<Spinner />
			</Stack>
		);
	}

	if ( ! counts ) {
		return null;
	}

	const total = counts.good + counts.recommended + counts.critical;
	const percentage =
		total > 0 ? Math.round( ( counts.good / total ) * 100 ) : 0;
	const issuesTotal = counts.recommended + counts.critical;
	const tone = toneForPercentage( percentage );
	const href = reviewHref( counts );

	const path = links?.match( href ) ?? null;
	const HostLink = links?.Link;
	const reviewLabel = sprintf(
		/* translators: %d: Number of issues to address. */
		_n( 'Review %d item', 'Review %d items', issuesTotal ),
		issuesTotal
	);

	return (
		<Stack
			className={ styles.root }
			align="center"
			direction="column"
			justify="center"
			gap="lg"
		>
			<CircleProgress percentage={ percentage } tone={ tone } />
			<Text variant="body-lg">{ statusMessage( counts ) }</Text>
			{ issuesTotal > 0 &&
				( path !== null && HostLink ? (
					<Link render={ <HostLink path={ path } /> }>
						{ reviewLabel }
					</Link>
				) : (
					<Link href={ href }>{ reviewLabel }</Link>
				) ) }
		</Stack>
	);
}
