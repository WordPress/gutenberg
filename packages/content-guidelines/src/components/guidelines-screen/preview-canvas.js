/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { ComboboxControl, Spinner } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Preview canvas with fixture selector.
 *
 * @param {Object}   props              Component props.
 * @param {number}   props.postId       Selected post ID.
 * @param {Function} props.onPostSelect Callback when post is selected.
 * @return {JSX.Element} Preview canvas component.
 */
export default function PreviewCanvas( { postId, onPostSelect } ) {
	const [ searchInput, setSearchInput ] = useState( '' );

	// Fetch posts for the selector.
	const { posts, isLoading } = useSelect(
		( select ) => {
			const { getEntityRecords, isResolving } = select( coreStore );

			const query = {
				per_page: 20,
				status: 'publish',
				orderby: 'date',
				order: 'desc',
			};

			if ( searchInput ) {
				query.search = searchInput;
			}

			return {
				posts: getEntityRecords( 'postType', 'post', query ) || [],
				isLoading: isResolving( 'getEntityRecords', [
					'postType',
					'post',
					query,
				] ),
			};
		},
		[ searchInput ]
	);

	// Fetch selected post content.
	const selectedPost = useSelect(
		( select ) => {
			if ( ! postId ) {
				return null;
			}

			return select( coreStore ).getEntityRecord(
				'postType',
				'post',
				postId
			);
		},
		[ postId ]
	);

	// Auto-select first post if none selected.
	useEffect( () => {
		if ( ! postId && posts.length > 0 ) {
			onPostSelect( posts[ 0 ].id );
		}
	}, [ postId, posts, onPostSelect ] );

	// Build options for combobox.
	const options = posts.map( ( post ) => ( {
		value: post.id,
		label: post.title.rendered || __( '(No title)', 'content-guidelines' ),
	} ) );

	// Get plain text content for preview.
	const getPlainContent = ( html ) => {
		const div = document.createElement( 'div' );
		div.innerHTML = html;
		return div.textContent || div.innerText || '';
	};

	return (
		<div className="content-guidelines-preview">
			<div className="content-guidelines-preview__selector">
				<label className="content-guidelines-preview__label">
					{ __( 'Preview content:', 'content-guidelines' ) }
				</label>
				<ComboboxControl
					value={ postId }
					onChange={ onPostSelect }
					options={ options }
					onFilterValueChange={ setSearchInput }
					__experimentalRenderItem={ ( { item } ) => (
						<span>{ item.label }</span>
					) }
				/>
			</div>

			<div className="content-guidelines-preview__content">
				{ isLoading && (
					<div className="content-guidelines-preview__loading">
						<Spinner />
					</div>
				) }

				{ ! isLoading && selectedPost && (
					<article className="content-guidelines-preview__article">
						<h2 className="content-guidelines-preview__title">
							{ selectedPost.title.rendered ||
								__( '(No title)', 'content-guidelines' ) }
						</h2>
						<div className="content-guidelines-preview__body">
							{ getPlainContent(
								selectedPost.content.rendered
							).substring( 0, 2000 ) }
						</div>
					</article>
				) }

				{ ! isLoading && ! selectedPost && posts.length === 0 && (
					<div className="content-guidelines-preview__empty">
						<p>
							{ __(
								'No posts found. Create a post to use as a test fixture.',
								'content-guidelines'
							) }
						</p>
					</div>
				) }
			</div>
		</div>
	);
}
