/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { Spinner } from '@wordpress/components';

// Dashboard is still experimental.
// eslint-disable-next-line @wordpress/use-recommended-components
import { Link } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import styles from './style.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type TestStatus = 'good' | 'recommended' | 'critical';

type TestResult = {
	status: TestStatus;
};

type IssueCounts = {
	good: number;
	recommended: number;
	critical: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

// Async site health tests exposed via the REST API.
const ASYNC_TEST_PATHS = [
	'/wp-site-health/v1/tests/background-updates',
	'/wp-site-health/v1/tests/loopback-requests',
	'/wp-site-health/v1/tests/https-status',
	'/wp-site-health/v1/tests/dotorg-communication',
	'/wp-site-health/v1/tests/authorization-header',
] as const;

// SVG circle geometry (matches WP core's site-health progress ring).
const RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ≈ 565.48

// ─── Helpers ──────────────────────────────────────────────────────────────────

type HealthTone = 'success' | 'warning' | 'error';

/**
 * Maps a percentage to a semantic tone used for CSS class selection.
 *
 * @param {number} pct Percentage of passing tests (0–100).
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

// ─── Circle progress ──────────────────────────────────────────────────────────

/**
 * @param {{ percentage: number, tone: HealthTone }} props
 */
function CircleProgress( {
	percentage,
	tone,
}: {
	percentage: number;
	tone: HealthTone;
} ) {
	const offset = CIRCUMFERENCE * ( 1 - percentage / 100 );

	return (
		<div className={ `${ styles.circle } ${ styles[ `is-${ tone }` ] }` }>
			<svg
				aria-hidden="true"
				focusable="false"
				viewBox="0 0 200 200"
				width="100%"
				height="100%"
			>
				<circle
					r={ RADIUS }
					cx="100"
					cy="100"
					fill="transparent"
					strokeDasharray={ CIRCUMFERENCE }
					strokeDashoffset={ 0 }
				/>
				<circle
					r={ RADIUS }
					cx="100"
					cy="100"
					fill="transparent"
					strokeDasharray={ CIRCUMFERENCE }
					strokeDashoffset={ offset }
				/>
			</svg>
		</div>
	);
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SiteHealth() {
	const [ counts, setCounts ] = useState< IssueCounts | null >( null );
	const [ isLoading, setIsLoading ] = useState( true );

	useEffect( () => {
		const requests = ASYNC_TEST_PATHS.map( ( path ) =>
			apiFetch< TestResult >( { path } ).catch( () => null )
		);

		Promise.all( requests ).then( ( results ) => {
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
	}, [] );

	if ( isLoading ) {
		return <Spinner />;
	}

	if ( ! counts ) {
		return null;
	}

	const total = counts.good + counts.recommended + counts.critical;
	const percentage =
		total > 0 ? Math.round( ( counts.good / total ) * 100 ) : 0;
	const issuesTotal = counts.recommended + counts.critical;
	const tone = toneForPercentage( percentage );

	return (
		<div className={ styles.widget }>
			<div
				className={ `${ styles.header } ${ styles[ `is-${ tone }` ] }` }
			>
				<CircleProgress percentage={ percentage } tone={ tone } />
				<span className={ styles.percentage }>{ percentage }%</span>
			</div>

			<div className={ styles.details }>
				<p>{ statusMessage( counts ) }</p>

				{ issuesTotal > 0 && (
					<p>
						{ sprintf(
							/* translators: %d: Number of issues to address. */
							_n(
								'There is %d item to review.',
								'There are %d items to review.',
								issuesTotal
							),
							issuesTotal
						) }{ ' ' }
						<Link href="site-health.php">
							{ __( 'Open Site Health' ) }
						</Link>
					</p>
				) }
			</div>
		</div>
	);
}
