/**
 * WordPress dependencies
 */
import { useState, useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __, _x, sprintf } from '@wordpress/i18n';
import { dateI18n } from '@wordpress/date';
import { TextControl, TextareaControl, Button } from '@wordpress/components';

// Dashboard is still experimental.
// eslint-disable-next-line @wordpress/use-recommended-components
import { Link, Text } from '@wordpress/ui';
import type { Post } from '@wordpress/core-data';

// ─── Types ────────────────────────────────────────────────────────────────────

type DraftPost = Post & {
	title: { rendered: string; raw?: string };
	content: { rendered: string; raw?: string };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the first N words of a plain-text string, mirroring PHP's
 * `wp_trim_words()` with the `draft_length` locale value (default 10).
 *
 * @param {string} text     Input text.
 * @param {number} maxWords Maximum number of words to keep.
 */
function trimWords( text: string, maxWords: number ): string {
	const words = text
		.replace( /<[^>]+>/g, ' ' )
		.trim()
		.split( /\s+/ )
		.filter( Boolean );

	if ( words.length <= maxWords ) {
		return words.join( ' ' );
	}

	return words.slice( 0, maxWords ).join( ' ' ) + '\u2026';
}

// ─── Recent Drafts ────────────────────────────────────────────────────────────

/**
 * @param {{ id: number }} props
 */
function DraftItem( { post }: { post: DraftPost } ) {
	const title =
		( post.title as { rendered: string } )?.rendered ||
		/* translators: Placeholder for a draft post with no title. */
		__( '(no title)' );

	const rawContent =
		( post.content as { raw?: string; rendered: string } )?.raw ??
		( post.content as { rendered: string } )?.rendered ??
		'';

	/* translators: Maximum number of words used in a draft preview on the dashboard. */
	const draftLength = parseInt( _x( '10', 'draft_length' ), 10 ) || 10;
	const excerpt = trimWords( rawContent, draftLength );

	const editUrl = `post.php?post=${ post.id }&action=edit`;

	/* translators: Date format for draft timestamps on the dashboard, see https://www.php.net/manual/datetime.format.php */
	const formattedDate = dateI18n(
		__( 'F j, Y' ),
		( post.modified as string ) ?? ''
	);

	return (
		<li>
			<div>
				<Link
					href={ editUrl }
					aria-label={ sprintf(
						/* translators: %s: post title */
						__( 'Edit \u201c%s\u201d' ),
						title
					) }
				>
					{ title }
				</Link>
				<time dateTime={ ( post.modified as string ) ?? '' }>
					{ formattedDate }
				</time>
			</div>
			{ excerpt && <p>{ excerpt }</p> }
		</li>
	);
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function QuickDraft() {
	const [ title, setTitle ] = useState( '' );
	const [ content, setContent ] = useState( '' );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ notice, setNotice ] = useState< {
		type: 'success' | 'error';
		message: string;
	} | null >( null );

	const currentUser = useSelect(
		( select ) => select( coreStore ).getCurrentUser(),
		[]
	);

	const drafts = useSelect(
		( select ) => {
			if ( ! currentUser?.id ) {
				return undefined;
			}

			return select( coreStore ).getEntityRecords< DraftPost >(
				'postType',
				'post',
				{
					status: 'draft',
					author: currentUser.id,
					orderby: 'modified',
					order: 'desc',
					per_page: 3,
					context: 'edit',
				}
			);
		},
		[ currentUser?.id ]
	);

	const { saveEntityRecord, invalidateResolution } = useDispatch( coreStore );

	const handleSave = useCallback( async () => {
		if ( ! title.trim() ) {
			return;
		}

		setIsSaving( true );
		setNotice( null );

		try {
			await saveEntityRecord( 'postType', 'post', {
				title,
				content,
				status: 'draft',
			} );

			// Bust the drafts cache so the new post appears in the list.
			invalidateResolution( 'getEntityRecords', [
				'postType',
				'post',
				{
					status: 'draft',
					author: currentUser?.id,
					orderby: 'modified',
					order: 'desc',
					per_page: 3,
					context: 'edit',
				},
			] );

			setTitle( '' );
			setContent( '' );
			setNotice( { type: 'success', message: __( 'Draft saved.' ) } );
		} catch {
			setNotice( {
				type: 'error',
				message: __( 'An error occurred. Please try again.' ),
			} );
		} finally {
			setIsSaving( false );
		}
	}, [
		title,
		content,
		currentUser?.id,
		saveEntityRecord,
		invalidateResolution,
	] );

	const hasDrafts = !! drafts && drafts.length > 0;

	return (
		<>
			<TextControl
				label={ __( 'Title' ) }
				value={ title }
				onChange={ setTitle }
				autoComplete="off"
				__nextHasNoMarginBottom
			/>
			<TextareaControl
				label={ __( 'Content' ) }
				value={ content }
				onChange={ setContent }
				placeholder={ __( 'What\u2019s on your mind?' ) }
				rows={ 3 }
				__nextHasNoMarginBottom
			/>

			{ notice && <p aria-live="polite">{ notice.message }</p> }

			<Button
				variant="primary"
				onClick={ handleSave }
				isBusy={ isSaving }
				disabled={ isSaving || ! title.trim() }
			>
				{ __( 'Save Draft' ) }
			</Button>

			{ hasDrafts && (
				<section aria-label={ __( 'Your Recent Drafts' ) }>
					<Text variant="heading-md" render={ <h3 /> }>
						{ __( 'Your Recent Drafts' ) }
					</Text>
					<p>
						<Link href="edit.php?post_status=draft&post_type=post">
							{ __( 'View all drafts' ) }
						</Link>
					</p>
					<ul>
						{ drafts.map( ( post ) => (
							<DraftItem key={ post.id } post={ post } />
						) ) }
					</ul>
				</section>
			) }
		</>
	);
}
