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

function usePostContentExcerpt( wordCount, postId, postType ) {
	// Don't destrcuture items from content here, it can be undefined.
	const [ , , content ] = useEntityProp(
		'postType',
		postType,
		'content',
		postId
	);
	const rawPostContent = content?.raw;
	return useMemo( () => {
		if ( ! rawPostContent ) {
			return '';
		}
		const excerptElement = document.createElement( 'div' );
		excerptElement.innerHTML = rawPostContent;
		const excerpt =
			excerptElement.textContent || excerptElement.innerText || '';
		return excerpt.trim().split( ' ', wordCount ).join( ' ' );
	}, [ rawPostContent, wordCount ] );
}

export default function PostExcerptEditor( {
	attributes: { textAlign, wordCount, moreText, showMoreOnNewLine },
	setAttributes,
	isSelected,
	context: { postId, postType },
} ) {
	const [ excerpt, setExcerpt ] = useEntityProp(
		'postType',
		postType,
		'excerpt',
		postId
	);
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
