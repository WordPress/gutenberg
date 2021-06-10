/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';
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
import {
	useIsEditablePostBlock,
	useCanUserEditPostBlock,
} from '../utils/hooks';

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
	clientId,
	attributes: { textAlign, wordCount, moreText, showMoreOnNewLine },
	setAttributes,
	isSelected,
	context: { postId, postType },
} ) {
	const isEditable = useIsEditablePostBlock( clientId, postId, postType );
	const userHasEditRights = useCanUserEditPostBlock( postId, postType );
	const [
		excerpt,
		setExcerpt,
		{ protected: isProtected } = {},
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
	if ( ! postType || ! postId ) {
		return (
			<div { ...blockProps }>
				<Warning>
					{ __( 'Post excerpt block: no post found.' ) }
				</Warning>
			</div>
		);
	}
	if ( isProtected && ! userHasEditRights ) {
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
				excerpt ||
				postContentExcerpt ||
				( isSelected ? '' : __( 'No post excerpt found' ) )
			}
			onChange={ setExcerpt }
		/>
	) : (
		excerpt || postContentExcerpt || __( 'No post excerpt found' )
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
					{ ! excerpt && (
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
