/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Named time-range presets selectable via the widget's `timeRange`
 * attribute. `custom` requires a companion `customDate` (`YYYY-MM-DD`).
 */
export type TimeRange =
	| 'one-year-ago'
	| 'five-years-ago'
	| 'ten-years-ago'
	| 'oldest-on-this-day'
	| 'custom';

/**
 * Subset of the WordPress post REST shape consumed by the widget,
 * normalized so the view does not need to know that the featured image
 * URL comes from a separate `attachment` entity.
 */
export interface OnThisDayPost {
	id: number;
	date: string;
	title: { rendered: string };
	excerpt: { rendered: string };
	link: string;
	commentCount: number;
	featuredImageUrl: string | null;
}

/**
 * Raw post record returned by the posts collection. `featured_media` is
 * the attachment id; the URL is resolved with a second `getEntityRecord`
 * call against the `attachment` entity.
 */
interface RawPost {
	id: number;
	date: string;
	title: { rendered: string };
	excerpt: { rendered: string };
	link: string;
	featured_media?: number;
	comment_count?: string | number;
}

/**
 * Minimal subset of an `attachment` REST record consumed by the hook.
 */
interface AttachmentRecord {
	id: number;
	source_url?: string;
}

/**
 * Return value of {@link useOnThisDayPost}.
 */
export interface UseOnThisDayPostResult {
	/**
	 * The matching post resolved by the selected time range, or `null`
	 * when no post matches or the request has not resolved yet.
	 */
	post: OnThisDayPost | null;

	/**
	 * `true` until the underlying `getEntityRecords` resolver has settled.
	 */
	isResolving: boolean;

	/**
	 * Whether the user has at least one published post overall. Used by
	 * the surface to bifurcate the empty state between "write your first
	 * post" (no history) and "broaden the search" (history exists but
	 * nothing matches the current filter).
	 */
	hasAnyPosts: boolean;
}

/**
 * Hook options. All optional; defaults to the `one-year-ago` preset.
 */
export interface UseOnThisDayPostOptions {
	timeRange?: TimeRange;
	customDate?: string;
}

/**
 * Formats a `Date` as the `MM-DD` string expected by the
 * `on_this_day` REST parameter.
 *
 * @param date Date to format.
 * @return Zero-padded month and day separated by a dash.
 */
export function toMonthDay( date: Date ): string {
	const month = String( date.getMonth() + 1 ).padStart( 2, '0' );
	const day = String( date.getDate() ).padStart( 2, '0' );
	return `${ month }-${ day }`;
}

/**
 * Formats a `Date` as `YYYY-MM-DD` in the local calendar, suitable for
 * building `after`/`before` REST parameters against a specific day.
 *
 * @param date Date to format.
 * @return Year, month, and day joined with dashes.
 */
function toYearMonthDay( date: Date ): string {
	const year = String( date.getFullYear() );
	const month = String( date.getMonth() + 1 ).padStart( 2, '0' );
	const day = String( date.getDate() ).padStart( 2, '0' );
	return `${ year }-${ month }-${ day }`;
}

/**
 * Returns `now` shifted back by `years`. Calendar-safe via `setFullYear`
 * (leap-day shifts to Feb 28 of the target year by JavaScript spec).
 *
 * @param now   Reference date to shift back from.
 * @param years Number of years to subtract.
 * @return New `Date` shifted into the past.
 */
function shiftYears( now: Date, years: number ): Date {
	const next = new Date( now );
	next.setFullYear( next.getFullYear() - years );
	return next;
}

/**
 * Translates the selected time range into the REST query fragment that
 * narrows the posts collection to the matching day(s).
 *
 * - `one-year-ago` / `five-years-ago` / `ten-years-ago`: a single
 *   calendar day in the past, queried with native `after` / `before`.
 * - `oldest-on-this-day`: matches today's month and day across all
 *   years, using the `on_this_day` filter registered by the plugin.
 * - `custom`: a single calendar day specified by `customDate` (`YYYY-MM-DD`).
 *
 * @param timeRange  Selected preset.
 * @param customDate Calendar day for the `custom` preset; ignored otherwise.
 * @param now        Reference date used to anchor the relative presets.
 * @return REST query fragment, or `null` when the inputs do not resolve
 *         to a valid query (e.g. `custom` without a parseable date).
 */
export function buildTimeRangeQuery(
	timeRange: TimeRange,
	customDate: string | undefined,
	now: Date
): Record< string, string > | null {
	if ( timeRange === 'oldest-on-this-day' ) {
		return { on_this_day: toMonthDay( now ) };
	}

	let target: Date | null = null;

	if ( timeRange === 'one-year-ago' ) {
		target = shiftYears( now, 1 );
	} else if ( timeRange === 'five-years-ago' ) {
		target = shiftYears( now, 5 );
	} else if ( timeRange === 'ten-years-ago' ) {
		target = shiftYears( now, 10 );
	} else if ( timeRange === 'custom' && customDate ) {
		const parsed = new Date( `${ customDate }T00:00:00` );
		if ( ! Number.isNaN( parsed.getTime() ) ) {
			target = parsed;
		}
	}

	if ( ! target ) {
		return null;
	}

	const ymd = toYearMonthDay( target );
	return {
		after: `${ ymd }T00:00:00`,
		before: `${ ymd }T23:59:59`,
	};
}

/**
 * Reads the post that matches the selected time range, then resolves
 * its featured image via the `attachment` entity.
 *
 * Calls the native posts collection with either the `on_this_day=MM-DD`
 * parameter (for the cross-year preset) or `after`/`before` (for a
 * specific day). When the post has a non-zero `featured_media`, a
 * second core-data selector fetches the attachment record; the URL is
 * flattened into `featuredImageUrl` for the view. Both requests are
 * cached and deduplicated by core-data.
 *
 * @param options            Hook options.
 * @param options.timeRange  Preset that drives which post the hook surfaces.
 *                           Defaults to `oldest-on-this-day`.
 * @param options.customDate Calendar day (`YYYY-MM-DD`) used when
 *                           `timeRange` is `custom`.
 * @return The matching post and a resolution flag.
 */
export default function useOnThisDayPost( {
	timeRange = 'oldest-on-this-day',
	customDate,
}: UseOnThisDayPostOptions = {} ): UseOnThisDayPostResult {
	return useSelect(
		( select ) => {
			const { getEntityRecords, getEntityRecord } = select( coreStore );

			const anyPostsProbe = getEntityRecords( 'postType', 'post', {
				per_page: 1,
				status: 'publish',
				_fields: 'id',
			} ) as Array< { id: number } > | null;
			const probeIsResolving = anyPostsProbe === null;
			const hasAnyPosts =
				anyPostsProbe !== null && anyPostsProbe.length > 0;

			const dateQuery = buildTimeRangeQuery(
				timeRange,
				customDate,
				new Date()
			);

			if ( ! dateQuery ) {
				return {
					post: null,
					isResolving: probeIsResolving,
					hasAnyPosts,
				};
			}

			const records = getEntityRecords( 'postType', 'post', {
				...dateQuery,
				per_page: 1,
				orderby: 'date',
				order: 'asc',
				_fields:
					'id,date,title,excerpt,link,featured_media,comment_count',
			} ) as RawPost[] | null;

			if ( records === null ) {
				return { post: null, isResolving: true, hasAnyPosts };
			}

			const raw = records[ 0 ];

			if ( ! raw ) {
				return {
					post: null,
					isResolving: probeIsResolving,
					hasAnyPosts,
				};
			}

			const mediaId = raw.featured_media ?? 0;
			const media = mediaId
				? ( getEntityRecord( 'postType', 'attachment', mediaId, {
						context: 'view',
				  } ) as AttachmentRecord | undefined | null )
				: null;

			return {
				post: {
					id: raw.id,
					date: raw.date,
					title: raw.title,
					excerpt: raw.excerpt,
					link: raw.link,
					commentCount: Number( raw.comment_count ?? 0 ),
					featuredImageUrl: media?.source_url ?? null,
				},
				isResolving: false,
				hasAnyPosts,
			};
		},
		[ timeRange, customDate ]
	);
}
