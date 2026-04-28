/**
 * WordPress dependencies
 */
import { useId } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import { dateI18n, getDate } from '@wordpress/date';
import type { Post, Comment } from '@wordpress/core-data';

// ─── Date helpers ─────────────────────────────────────────────────────────────

/**
 * Formats a date string into a human-readable label, mirroring the PHP logic
 * in `wp_dashboard_recent_posts()`. Uses `dateI18n` so the result respects the
 * site timezone and locale (same as PHP's `date_i18n()`):
 *
 *  - Same calendar day  → "Today"
 *  - Next calendar day  → "Tomorrow"
 *  - Same year          → "Jun 15th"
 *  - Different year     → "Jun 15th 2023"
 *
 * @param {string} dateString ISO date string to format.
 */
function formatDate( dateString: string ): string {
	const now = getDate();

	const postDay = dateI18n( 'Y-m-d', dateString );
	const today = dateI18n( 'Y-m-d', now );

	if ( postDay === today ) {
		return __( 'Today' );
	}

	const tomorrow = getDate();
	tomorrow.setDate( tomorrow.getDate() + 1 );
	const tomorrowDay = dateI18n( 'Y-m-d', tomorrow );

	if ( postDay === tomorrowDay ) {
		return __( 'Tomorrow' );
	}

	const postYear = dateI18n( 'Y', dateString );
	const currentYear = dateI18n( 'Y', now );

	if ( postYear !== currentYear ) {
		/* translators: Date format for dashboard posts from a different year, see https://www.php.net/manual/datetime.format.php */
		return dateI18n( __( 'M jS Y' ), dateString );
	}

	/* translators: Date format for dashboard posts from the current year, see https://www.php.net/manual/datetime.format.php */
	return dateI18n( __( 'M jS' ), dateString );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface PostSectionProps {
	title: string;
	sectionId: string;
	status: 'publish' | 'future';
	order: 'asc' | 'desc';
}

function PostSection( { title, sectionId, status, order }: PostSectionProps ) {
	const posts = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords< Post >( 'postType', 'post', {
				status,
				orderby: 'date',
				order,
				per_page: 5,
			} ),
		[ status, order ]
	);

	if ( ! posts?.length ) {
		return null;
	}

	return (
		<div id={ sectionId } className="activity-block">
			<h3>{ title }</h3>
			<ul>
				{ posts.map( ( post ) => (
					<li key={ post.id }>
						<span>
							{
								/* translators: 1: Relative date (Today/Tomorrow/Jun 15th), 2: Time */
								sprintf(
									/* translators: 1: date, 2: time */
									__( '%1$s, %2$s' ),
									formatDate( post.date ),
									/* translators: Time format for dashboard post list, see https://www.php.net/manual/datetime.format.php */
									dateI18n( __( 'g:i a' ), post.date )
								)
							}
						</span>{ ' ' }
						<a href={ post.link }>
							{ ( post.title as { rendered: string } )
								?.rendered || __( '(no title)' ) }
						</a>
					</li>
				) ) }
			</ul>
		</div>
	);
}

function CommentsSection() {
	const sectionId = useId();
	const comments = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords< Comment >(
				'root',
				'comment',
				{
					per_page: 5,
				}
			),
		[]
	);

	if ( ! comments?.length ) {
		return null;
	}

	return (
		<div id={ sectionId } className="activity-block table-view-list">
			<h3>{ __( 'Recent Comments' ) }</h3>
			<ul>
				{ comments.map( ( comment ) => {
					const authorName = comment.author_name as string;
					const authorUrl = comment.author_url as string;
					const content = ( comment.content as { rendered: string } )
						?.rendered;

					return (
						<li key={ comment.id }>
							<div className="dashboard-comment-wrap">
								<p className="comment-meta">
									{ authorUrl ? (
										<a href={ authorUrl }>
											<cite className="comment-author">
												{ authorName }
											</cite>
										</a>
									) : (
										<cite className="comment-author">
											{ authorName }
										</cite>
									) }
								</p>
								<blockquote>
									<p
										dangerouslySetInnerHTML={ {
											__html: content,
										} }
									/>
								</blockquote>
							</div>
						</li>
					);
				} ) }
			</ul>
		</div>
	);
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Activity() {
	const widgetId = useId();
	const futurePosts = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords< Post >( 'postType', 'post', {
				status: 'future',
				orderby: 'date',
				order: 'asc',
				per_page: 5,
			} ),
		[]
	);

	const recentPosts = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords< Post >( 'postType', 'post', {
				status: 'publish',
				orderby: 'date',
				order: 'desc',
				per_page: 5,
			} ),
		[]
	);

	const comments = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords< Comment >(
				'root',
				'comment',
				{
					per_page: 5,
				}
			),
		[]
	);

	const isResolved =
		futurePosts !== undefined &&
		recentPosts !== undefined &&
		comments !== undefined;

	if (
		isResolved &&
		! futurePosts?.length &&
		! recentPosts?.length &&
		! comments?.length
	) {
		return (
			<div className="no-activity">
				<p>{ __( 'No activity yet!' ) }</p>
			</div>
		);
	}

	return (
		<div id={ widgetId }>
			<PostSection
				title={ __( 'Publishing Soon' ) }
				sectionId="future-posts"
				status="future"
				order="asc"
			/>
			<PostSection
				title={ __( 'Recently Published' ) }
				sectionId="published-posts"
				status="publish"
				order="desc"
			/>
			<CommentsSection />
		</div>
	);
}
