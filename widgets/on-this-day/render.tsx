/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import apiFetch from '@wordpress/api-fetch';
import { __, _n, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { postList } from '@wordpress/icons';

// Dashboard is still experimental.
/* eslint-disable @wordpress/use-recommended-components -- `Notice` for load errors; tracked with WPDS adoption. */
import {
	Badge,
	Card,
	EmptyState,
	Link,
	Notice,
	Stack,
	Text,
} from '@wordpress/ui';
/* eslint-enable @wordpress/use-recommended-components */

/**
 * Internal dependencies
 */
import styles from './style.module.css';

type OnThisDayAttributes = {
	windowDays?: number;
};

type WidgetProps = {
	attributes?: OnThisDayAttributes;
	setAttributes?: ( next: Partial< OnThisDayAttributes > ) => void;
};

type OnThisDayThumbnail = {
	url: string;
	width: number;
	height: number;
	srcset: string;
	alt: string;
} | null;

type OnThisDayCategory = {
	id: number;
	name: string;
	slug: string;
	link: string;
};

type OnThisDayPost = {
	id: number;
	title: string;
	status: string;
	excerpt: string;
	time_iso: string;
	time_display: string;
	edit_url: string;
	view_url: string;
	categories: OnThisDayCategory[];
	thumbnail: OnThisDayThumbnail;
};

type OnThisDayYearGroup = {
	year: number;
	years_ago: number;
	posts: OnThisDayPost[];
};

type OnThisDayPayload = {
	window_days: number;
	window_label: string;
	years: OnThisDayYearGroup[];
};

const MIN_WINDOW = 1;
const MAX_WINDOW = 7;

function clampWindowDays( value: unknown ): number {
	const n =
		typeof value === 'number' ? value : parseInt( String( value ), 10 );
	if ( Number.isNaN( n ) ) {
		return MIN_WINDOW;
	}
	return Math.min( MAX_WINDOW, Math.max( MIN_WINDOW, n ) );
}

function yearsAgoLabel( yearsAgo: number ): string {
	if ( yearsAgo === 1 ) {
		return __( '1 yr ago' );
	}
	return sprintf(
		/* translators: %d: Number of years since the post was published. */
		__( '%d yrs ago' ),
		yearsAgo
	);
}

/**
 * @param windowDays Number of days in the “on this day” window (1–7).
 */
function getRangeDayCountLabel( windowDays: number ): string {
	return sprintf(
		/* translators: %d: Number of days in the date range control. */
		_n( '%d day', '%d days', windowDays ),
		windowDays
	);
}

export default function OnThisDay( {
	attributes,
	setAttributes,
}: WidgetProps ) {
	const windowDays = clampWindowDays( attributes?.windowDays );

	const authorId = useSelect(
		( select ) =>
			select( coreStore ).getCurrentUser()?.id as number | undefined,
		[]
	);

	const [ data, setData ] = useState< OnThisDayPayload | null >( null );
	const [ loadError, setLoadError ] = useState< Error | null >( null );
	const [ isLoading, setIsLoading ] = useState( false );

	useEffect( () => {
		if ( ! authorId ) {
			setData( null );
			setLoadError( null );
			setIsLoading( false );
			return;
		}

		let cancelled = false;
		setIsLoading( true );
		setLoadError( null );

		apiFetch< OnThisDayPayload >( {
			path: addQueryArgs( '/wp/v2/on-this-day', {
				window_days: windowDays,
			} ),
		} )
			.then( ( response ) => {
				if ( ! cancelled ) {
					setData( response );
				}
			} )
			.catch( ( err: unknown ) => {
				if ( ! cancelled ) {
					setLoadError(
						err instanceof Error ? err : new Error( String( err ) )
					);
					setData( null );
				}
			} )
			.finally( () => {
				if ( ! cancelled ) {
					setIsLoading( false );
				}
			} );

		return () => {
			cancelled = true;
		};
	}, [ authorId, windowDays ] );

	if ( ! authorId ) {
		return (
			<Stack align="center" justify="center" style={ { minHeight: 160 } }>
				<Text variant="body-sm" style={ { opacity: 0.75 } }>
					{ __( 'Sign in to see your writing history.' ) }
				</Text>
			</Stack>
		);
	}

	if ( isLoading ) {
		return (
			<Stack align="center" justify="center" style={ { minHeight: 160 } }>
				<Text variant="body-sm" style={ { opacity: 0.75 } }>
					{ __( 'Loading…' ) }
				</Text>
			</Stack>
		);
	}

	if ( loadError ) {
		return (
			<Notice.Root intent="error">
				<Notice.Description>
					{ __(
						'Could not load On This Day. Please try again in a moment.'
					) }
				</Notice.Description>
			</Notice.Root>
		);
	}

	const windowLabel = data?.window_label ?? '';

	const windowRangeField = setAttributes ? (
		<div className={ styles.windowRow }>
			<Text variant="body-sm" style={ { opacity: 0.75 } }>
				{ __( 'Range' ) }
			</Text>
			<input
				className={ styles.range }
				type="range"
				min={ MIN_WINDOW }
				max={ MAX_WINDOW }
				value={ windowDays }
				aria-valuemin={ MIN_WINDOW }
				aria-valuemax={ MAX_WINDOW }
				aria-valuenow={ windowDays }
				onChange={ ( event ) =>
					setAttributes( {
						windowDays: clampWindowDays(
							( event.target as HTMLInputElement ).value
						),
					} )
				}
			/>
			<Text variant="body-sm" style={ { opacity: 0.75 } }>
				{ getRangeDayCountLabel( windowDays ) }
			</Text>
		</div>
	) : null;

	const isEmpty =
		! data ||
		! data.years?.length ||
		data.years.every( ( y ) => y.posts.length === 0 );

	if ( isEmpty ) {
		return (
			<Stack gap="md">
				<Stack direction="row" justify="flex-end" align="center">
					{ windowLabel ? (
						<Badge intent="informational">{ windowLabel }</Badge>
					) : null }
				</Stack>
				<EmptyState.Root>
					<EmptyState.Icon icon={ postList } />
					<EmptyState.Title>
						{ __( 'Nothing on this day (yet)' ) }
					</EmptyState.Title>
					<EmptyState.Description>
						{ windowDays === 1
							? sprintf(
									/* translators: %s: A formatted calendar date. */
									__(
										'You have not published anything on %s in a previous year. Publish something today and check back next year!'
									),
									windowLabel
							  )
							: sprintf(
									/* translators: %s: A formatted date range. */
									__(
										'You have not published anything between %s in previous years. Write something today and check back next year!'
									),
									windowLabel
							  ) }
					</EmptyState.Description>
				</EmptyState.Root>
				{ windowRangeField }
			</Stack>
		);
	}

	if ( ! data ) {
		return null;
	}

	return (
		<Stack gap="md">
			<Stack direction="row" justify="flex-end" align="center">
				{ windowLabel ? (
					<Badge intent="informational">{ windowLabel }</Badge>
				) : null }
			</Stack>

			<div className={ styles.scroll }>
				{ data.years.map( ( group ) => (
					<section key={ group.year }>
						<Text
							className={ styles.yearHeading }
							variant="heading-sm"
							render={ <h3 /> }
						>
							{ sprintf(
								/* translators: 1: Year, 2: Human-readable “years ago”. */
								__( '%1$d · %2$s' ),
								group.year,
								yearsAgoLabel( group.years_ago )
							) }
						</Text>
						<Stack
							gap="sm"
							render={
								<ul
									style={ {
										listStyle: 'none',
										margin: 0,
										padding: 0,
									} }
								/>
							}
						>
							{ group.posts.map( ( post ) => {
								const isPrivate = post.status === 'private';
								const isDraft = post.status === 'draft';

								return (
									<li
										key={ post.id }
										className={ styles.postBlock }
									>
										<Card.Content>
											<Stack gap="sm">
												<Stack
													direction="row"
													gap="sm"
													align="flex-start"
												>
													{ post.thumbnail ? (
														<div
															className={
																styles.thumbnail
															}
														>
															<img
																src={
																	post
																		.thumbnail
																		.url
																}
																width={
																	post
																		.thumbnail
																		.width
																}
																height={
																	post
																		.thumbnail
																		.height
																}
																srcSet={
																	post
																		.thumbnail
																		.srcset ||
																	undefined
																}
																alt={
																	post
																		.thumbnail
																		.alt
																}
																loading="lazy"
																decoding="async"
															/>
														</div>
													) : null }
													<Stack
														gap="xs"
														style={ {
															flex: 1,
															minWidth: 0,
														} }
													>
														<Stack
															direction="row"
															gap="sm"
															align="center"
															justify="space-between"
														>
															<Link
																href={
																	post.edit_url
																}
															>
																<Text
																	variant="body-md"
																	render={
																		<span />
																	}
																	style={ {
																		fontWeight: 600,
																	} }
																>
																	{
																		post.title
																	}
																</Text>
															</Link>
															<Stack
																direction="row"
																gap="xs"
																align="center"
															>
																{ isDraft ? (
																	<Badge intent="draft">
																		{ __(
																			'Draft'
																		) }
																	</Badge>
																) : null }
																{ isPrivate ? (
																	<Badge intent="draft">
																		{ __(
																			'Private'
																		) }
																	</Badge>
																) : null }
															</Stack>
														</Stack>
														{ post.excerpt ? (
															<Text
																variant="body-sm"
																style={ {
																	opacity: 0.85,
																} }
															>
																{ post.excerpt }
															</Text>
														) : null }
														<div
															className={
																styles.postMeta
															}
														>
															<time
																dateTime={
																	post.time_iso
																}
															>
																<Text
																	variant="body-sm"
																	style={ {
																		opacity: 0.75,
																	} }
																>
																	{
																		post.time_display
																	}
																</Text>
															</time>
															{ post.categories
																.length ? (
																<>
																	<span
																		className={
																			styles.metaSep
																		}
																		aria-hidden="true"
																	>
																		·
																	</span>
																	<span
																		className={
																			styles.categories
																		}
																	>
																		{ post.categories.map(
																			(
																				cat,
																				i
																			) => (
																				<span
																					key={
																						cat.id
																					}
																				>
																					{ i >
																					0 ? (
																						<span>
																							{
																								', '
																							}
																						</span>
																					) : null }
																					{ cat.link ? (
																						<Link
																							variant="unstyled"
																							href={
																								cat.link
																							}
																						>
																							{
																								cat.name
																							}
																						</Link>
																					) : (
																						cat.name
																					) }
																				</span>
																			)
																		) }
																	</span>
																</>
															) : null }
														</div>
														<div
															className={
																styles.actions
															}
														>
															<Link
																variant="default"
																href={
																	post.edit_url
																}
															>
																{ __( 'Edit' ) }
															</Link>
															{ post.view_url ? (
																<Link
																	variant="default"
																	href={
																		post.view_url
																	}
																>
																	{ __(
																		'View'
																	) }
																</Link>
															) : null }
														</div>
													</Stack>
												</Stack>
											</Stack>
										</Card.Content>
									</li>
								);
							} ) }
						</Stack>
					</section>
				) ) }
			</div>

			{ windowRangeField }
		</Stack>
	);
}
