/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { useMemo, RawHTML } from '@wordpress/element';
import {
	AlignmentToolbar,
	BlockControls,
	InspectorControls,
	RichText,
	Warning,
	useBlockProps,
} from '@wordpress/block-editor';
import { PanelBody, RangeControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useCanEditEntity } from '../utils/hooks';

function usePostContentExcerpt( wordCount, postId, postType ) {
	// Don't destrcuture items from content here, it can be undefined.
	const [ , , content ] = useEntityProp(
		'postType',
		postType,
		'content',
		postId
	);
	const renderedPostContent = content?.rendered;
	return useMemo( () => {
		if ( ! renderedPostContent ) {
			return '';
		}
		const excerptElement = document.createElement( 'div' );
		excerptElement.innerHTML = renderedPostContent;
		const excerpt =
			excerptElement.textContent || excerptElement.innerText || '';
		return excerpt.trim().split( ' ', wordCount ).join( ' ' );
	}, [ renderedPostContent, wordCount ] );
}

export default function PostExcerptEditor( {
	attributes: { textAlign, wordCount, moreText, showMoreOnNewLine },
	setAttributes,
	isSelected,
	context: { postId, postType, queryId },
} ) {
	const isDescendentOfQueryLoop = !! queryId;
	const userCanEdit = useCanEditEntity( 'postType', postType, postId );
	const isEditable = userCanEdit && ! isDescendentOfQueryLoop;
	const [
		rawExcerpt,
		setExcerpt,
		{ rendered: renderedExcerpt, protected: isProtected } = {},
	] = useEntityProp( 'postType', postType, 'excerpt', postId );
	const postContentExcerpt = usePostContentExcerpt(
		wordCount,
		postId,
		postType
	);
	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );
	/**
	 * Some themes might use `excerpt_more` filter to add links
	 * to excerpts generated from content. Since we display the
	 * renderedExcerpt from REST API links might be included.
	 * Before the application of this filter all content has been
	 * stripped of tags, so if we find any links there should come
	 * from the filter.
	 *
	 * In order to avoid a possible `inception` effect
	 * see: (https://github.com/WordPress/gutenberg/issues/33309)
	 * we change the `href` attribute of links to a `pseudo link`.
	 *
	 */
	const filteredRenderedExcerpt = useMemo( () => {
		const document = new window.DOMParser().parseFromString(
			renderedExcerpt,
			'text/html'
		);
		const links = document.getElementsByTagName( 'a' );
		if ( ! links?.length ) {
			return renderedExcerpt;
		}
		for ( const link of links ) {
			link.setAttribute( 'href', '#excerpt_more-pseudo-link' );
		}
		return document.body.innerHTML || '';
	}, [ renderedExcerpt ] );

	if ( ! postType || ! postId ) {
		return (
			<div { ...blockProps }>
				<Warning>
					{ __( 'Post excerpt block: no post found.' ) }
				</Warning>
			</div>
		);
	}
	if ( isProtected && ! userCanEdit ) {
		return (
			<div { ...blockProps }>
				<Warning>
					{ __(
						'There is no excerpt because this is a protected post.'
					) }
				</Warning>
			</div>
		);
	}
	const readMoreLink = (
		<RichText
			className="wp-block-post-excerpt__more-link"
			tagName="a"
			aria-label={ __( '"Read more" link text' ) }
			placeholder={ __( 'Add "read more" link text' ) }
			value={ moreText }
			onChange={ ( newMoreText ) =>
				setAttributes( { moreText: newMoreText } )
			}
		/>
	);
	const excerptContent = isEditable ? (
		<RichText
			className={
				! showMoreOnNewLine &&
				'wp-block-post-excerpt__excerpt is-inline'
			}
			aria-label={ __( 'Post excerpt text' ) }
			value={
				rawExcerpt ||
				postContentExcerpt ||
				( isSelected ? '' : __( 'No post excerpt found' ) )
			}
			onChange={ setExcerpt }
		/>
	) : (
		( filteredRenderedExcerpt && (
			<RawHTML
				key="html"
				onClick={ ( event ) => {
					event.preventDefault();
				} }
			>
				{ filteredRenderedExcerpt }
			</RawHTML>
		) ) ||
		__( 'No post excerpt found' )
	);
	return (
		<>
			<BlockControls>
				<AlignmentToolbar
					value={ textAlign }
					onChange={ ( newAlign ) =>
						setAttributes( { textAlign: newAlign } )
					}
				/>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Post Excerpt Settings' ) }>
					{ ! rawExcerpt && (
						<RangeControl
							label={ __( 'Max words' ) }
							value={ wordCount }
							onChange={ ( newExcerptLength ) =>
								setAttributes( { wordCount: newExcerptLength } )
							}
							min={ 10 }
							max={ 100 }
						/>
					) }
					<ToggleControl
						label={ __( 'Show link on new line' ) }
						checked={ showMoreOnNewLine }
						onChange={ ( newShowMoreOnNewLine ) =>
							setAttributes( {
								showMoreOnNewLine: newShowMoreOnNewLine,
							} )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{ excerptContent }
				{ ! showMoreOnNewLine && ' ' }
				{ showMoreOnNewLine ? (
					<p className="wp-block-post-excerpt__more-text">
						{ readMoreLink }
					</p>
				) : (
					readMoreLink
				) }
			</div>
		</>
	);
}
