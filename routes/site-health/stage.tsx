import { Breadcrumbs, Page } from '@wordpress/admin-ui';
import apiFetch from '@wordpress/api-fetch';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import type { Field, View } from '@wordpress/dataviews';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import {
	Fragment,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useNavigate, useSearch } from '@wordpress/route';
import { Badge, Stack, Text } from '@wordpress/ui';
import type { ComponentProps } from 'react';

/* Every async site health test core exposes over REST. The remaining core
   checks are direct (PHP-only) and have no endpoint; they appear only on
   the classic Site Health screen. The site-health widget reads the same
   set; keep `widgets/site-health/render.tsx` in sync. */
const ASYNC_TEST_PATHS = [
	'/wp-site-health/v1/tests/background-updates',
	'/wp-site-health/v1/tests/loopback-requests',
	'/wp-site-health/v1/tests/https-status',
	'/wp-site-health/v1/tests/dotorg-communication',
	'/wp-site-health/v1/tests/authorization-header',
	'/wp-site-health/v1/tests/page-cache',
] as const;

const CHECK_IDS = ASYNC_TEST_PATHS.map(
	( path ) => path.split( '/' ).pop() ?? path
);

const STATUSES = [ 'critical', 'recommended', 'good' ] as const;

type HealthCheckStatus = ( typeof STATUSES )[ number ];

type HealthCheck = {
	id: string;
	label: string;
	status: HealthCheckStatus;
	category: string;
	description: string[];
};

/* Ranked by attention required; drives the default status sort. */
const STATUS_ORDER: Record< HealthCheckStatus, number > = {
	critical: 0,
	recommended: 1,
	good: 2,
};

const STATUS_LABELS: Record< HealthCheckStatus, string > = {
	critical: __( 'Critical' ),
	recommended: __( 'Should be improved' ),
	good: __( 'Good' ),
};

/* The Badge intent scale is severity-shaped; map each status to the
   matching step. */
const STATUS_INTENTS: Record<
	HealthCheckStatus,
	NonNullable< ComponentProps< typeof Badge >[ 'intent' ] >
> = {
	critical: 'high',
	recommended: 'medium',
	good: 'stable',
};

const STATUS_ELEMENTS = STATUSES.map( ( value ) => ( {
	value,
	label: STATUS_LABELS[ value ],
} ) );

function isHealthCheckStatus( value: unknown ): value is HealthCheckStatus {
	return (
		typeof value === 'string' &&
		( STATUSES as readonly string[] ).includes( value )
	);
}

/* The status filter lives in the `status` search param, a comma-separated
   list with unknown values dropped, so a reload or a copied URL keeps it.
   The site-health widget links here with the statuses that have items. */
function statusesFromSearch( value: unknown ): HealthCheckStatus[] {
	if ( typeof value !== 'string' ) {
		return [];
	}

	return Array.from(
		new Set( value.split( ',' ).filter( isHealthCheckStatus ) )
	);
}

/* One line per block element, so paragraphs and list items keep their
   own line instead of running together. */
function descriptionToLines( html: string ): string[] {
	return html
		.split( /<\/(?:p|li)>/i )
		.map( ( chunk ) => stripHTML( chunk ).replace( /\s+/g, ' ' ).trim() )
		.filter( ( line ) => line !== '' );
}

/* The REST boundary: a malformed result drops to null rather than
   reaching the table mislabeled. */
function normalizeCheck( raw: unknown, id: string ): HealthCheck | null {
	if ( ! raw || typeof raw !== 'object' ) {
		return null;
	}

	const { label, status, badge, description } = raw as Record<
		string,
		unknown
	>;

	if ( typeof label !== 'string' || label === '' ) {
		return null;
	}

	if ( ! isHealthCheckStatus( status ) ) {
		return null;
	}

	const badgeLabel =
		badge &&
		typeof badge === 'object' &&
		typeof ( badge as { label?: unknown } ).label === 'string'
			? ( badge as { label: string } ).label
			: '';

	return {
		id,
		label,
		status,
		category: badgeLabel,
		description:
			typeof description === 'string'
				? descriptionToLines( description )
				: [],
	};
}

/* apiFetch rejections vary in shape; read a usable message or give none. */
function toMessage( reason: unknown ): string | null {
	if (
		reason &&
		typeof reason === 'object' &&
		'message' in reason &&
		typeof ( reason as { message: unknown } ).message === 'string' &&
		( reason as { message: string } ).message !== ''
	) {
		return stripHTML( ( reason as { message: string } ).message );
	}

	return null;
}

/* The route tree is assembled at runtime, so TanStack has no search schema
   to infer and types `search` against a placeholder. Describe the one call
   this page makes instead. */
type Navigate = ( options: {
	search?: (
		previous: Record< string, unknown >
	) => Record< string, unknown >;
	replace?: boolean;
} ) => void;

const DEFAULT_VIEW: View = {
	type: 'table',
	page: 1,
	perPage: 10,
	search: '',
	titleField: 'label',
	descriptionField: 'description',
	fields: [ 'status', 'category' ],
	sort: { field: 'status', direction: 'asc' },
};

function statusesFromView( view: View ): HealthCheckStatus[] {
	const filter = view.filters?.find( ( { field } ) => field === 'status' );
	if ( ! filter || ! Array.isArray( filter.value ) ) {
		return [];
	}

	return filter.value.filter( isHealthCheckStatus );
}

/* Puts the URL's statuses into the view: a status filter for them, or none
   when the URL carries none. */
function withStatuses( view: View, statuses: HealthCheckStatus[] ): View {
	const filters = ( view.filters ?? [] ).filter(
		( { field } ) => field !== 'status'
	);
	if ( statuses.length > 0 ) {
		filters.push( { field: 'status', operator: 'isAny', value: statuses } );
	}

	return { ...view, filters };
}

function SiteHealthPage() {
	const search = useSearch( { from: '/site-health' } ) as {
		status?: unknown;
	};
	const navigate = useNavigate() as Navigate;
	const statuses = useMemo(
		() => statusesFromSearch( search.status ),
		[ search.status ]
	);
	const [ checks, setChecks ] = useState< HealthCheck[] | null >( null );
	const [ unavailable, setUnavailable ] = useState( 0 );
	const [ errorMessage, setErrorMessage ] = useState< string | null >( null );
	const [ view, setView ] = useState< View >( () =>
		withStatuses( DEFAULT_VIEW, statuses )
	);

	/* Back/forward, or a link into this route, changes the URL under the
	   mounted page; the view follows. Writes from the view below leave the
	   two already equal. */
	useEffect( () => {
		setView( ( current ) =>
			statusesFromView( current ).join( ',' ) === statuses.join( ',' )
				? current
				: withStatuses( current, statuses )
		);
	}, [ statuses ] );

	const onChangeView = useCallback(
		( next: View ) => {
			setView( next );

			const nextStatuses = statusesFromView( next );
			if ( nextStatuses.join( ',' ) === statuses.join( ',' ) ) {
				return;
			}

			navigate( {
				search: ( previous ) => ( {
					...previous,
					status:
						nextStatuses.length > 0
							? nextStatuses.join( ',' )
							: undefined,
				} ),
				replace: true,
			} );
		},
		[ navigate, statuses ]
	);

	useEffect( () => {
		let cancelled = false;

		void Promise.allSettled(
			ASYNC_TEST_PATHS.map( ( path ) => apiFetch< unknown >( { path } ) )
		).then( ( results ) => {
			if ( cancelled ) {
				return;
			}

			const next: HealthCheck[] = [];
			let dropped = 0;
			let message: string | null = null;

			results.forEach( ( result, index ) => {
				if ( result.status === 'fulfilled' ) {
					const check = normalizeCheck(
						result.value,
						CHECK_IDS[ index ]
					);
					if ( check ) {
						next.push( check );
					} else {
						dropped += 1;
					}
					return;
				}

				dropped += 1;
				message = message ?? toMessage( result.reason );
			} );

			setChecks( next );
			setUnavailable( dropped );
			setErrorMessage( message );
		} );

		return () => {
			cancelled = true;
		};
	}, [] );

	const fields = useMemo( (): Field< HealthCheck >[] => {
		const categories = Array.from(
			new Set( ( checks ?? [] ).map( ( check ) => check.category ) )
		).filter( ( category ) => category !== '' );

		return [
			{
				id: 'label',
				label: __( 'Check' ),
				enableGlobalSearch: true,
				enableHiding: false,
			},
			{
				id: 'status',
				label: __( 'Status' ),
				elements: STATUS_ELEMENTS,
				filterBy: { operators: [ 'isAny' ] },
				render: ( { item }: { item: HealthCheck } ) => (
					<Badge intent={ STATUS_INTENTS[ item.status ] }>
						{ STATUS_LABELS[ item.status ] }
					</Badge>
				),
				sort: ( a, b, direction ) => {
					/*
					 * DataViews invokes a field comparator with the field
					 * values, though its public type declares items:
					 * `normalizeFields` wraps it over `getValue`.
					 */
					const delta =
						STATUS_ORDER[ a as unknown as HealthCheckStatus ] -
						STATUS_ORDER[ b as unknown as HealthCheckStatus ];
					return direction === 'asc' ? delta : -delta;
				},
			},
			{
				id: 'category',
				label: __( 'Category' ),
				elements: categories.map( ( category ) => ( {
					value: category,
					label: category,
				} ) ),
				render: ( { item }: { item: HealthCheck } ) =>
					item.category ? <Badge>{ item.category }</Badge> : null,
			},
			{
				id: 'description',
				label: __( 'Description' ),
				enableSorting: false,
				getValue: ( { item }: { item: HealthCheck } ) =>
					item.description.join( ' ' ),
				render: ( { item }: { item: HealthCheck } ) =>
					item.description.map( ( line, index ) => (
						<Fragment key={ index }>
							{ index > 0 && <br /> }
							{ line }
						</Fragment>
					) ),
			},
		];
	}, [ checks ] );

	const { data, paginationInfo } = useMemo(
		() => filterSortAndPaginate( checks ?? [], view, fields ),
		[ checks, view, fields ]
	);

	const isLoading = checks === null;

	if ( ! isLoading && checks.length === 0 && unavailable > 0 ) {
		return (
			<Page
				breadcrumbs={
					<Breadcrumbs
						items={ [
							{ label: __( 'Dashboard' ), to: '/' },
							{ label: __( 'Site Health' ) },
						] }
					/>
				}
				ariaLabel={ __( 'Site Health' ) }
				hasPadding
			>
				<Stack direction="column" gap="sm">
					<Text render={ <p /> }>
						{ errorMessage
							? sprintf(
									/* translators: %s: why the checks failed. */
									__(
										'The site health checks could not run: %s'
									),
									errorMessage
							  )
							: __( 'The site health checks could not run.' ) }
					</Text>
					<Text render={ <p /> }>
						{ __( 'Reload the page to try again.' ) }
					</Text>
				</Stack>
			</Page>
		);
	}

	return (
		<Page
			breadcrumbs={
				<Breadcrumbs
					items={ [
						{ label: __( 'Dashboard' ), to: '/' },
						{ label: __( 'Site Health' ) },
					] }
				/>
			}
			ariaLabel={ __( 'Site Health' ) }
			subTitle={ __( "Results from your site's latest health checks." ) }
			hasPadding={ false }
		>
			<Stack direction="column" gap="md">
				{ unavailable > 0 && (
					<Text render={ <p /> }>
						{ sprintf(
							/* translators: %d: number of health checks. */
							_n(
								'%d check could not run. Reload the page to try again.',
								'%d checks could not run. Reload the page to try again.',
								unavailable
							),
							unavailable
						) }
					</Text>
				) }
				<DataViews
					data={ data }
					fields={ fields }
					view={ view }
					onChangeView={ onChangeView }
					isLoading={ isLoading }
					defaultLayouts={ { table: {} } }
					paginationInfo={ paginationInfo }
					getItemId={ ( item ) => item.id }
				/>
			</Stack>
		</Page>
	);
}

export const stage = SiteHealthPage;
