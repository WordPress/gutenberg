/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
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

function useUserCanEdit( id, type ) {
	return useSelect(
		( select ) => {
			const { getPostType, canUser } = select( coreStore );
			const postType = getPostType( type );
			const resource = postType?.rest_base || '';
			return canUser( 'update', resource, id );
		},
		[ id, type ]
	);
}

export default function PostExcerptEditor( {
	attributes: { textAlign, wordCount, moreText, showMoreOnNewLine },
	setAttributes,
	isSelected,
	context: { postId, postType },
} ) {
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
	const userCanEdit = useUserCanEdit( postId, postType );
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
			<p { ...blockProps }>
				<Warning>
					{ __( 'This content is password protected.' ) }
				</Warning>
			</p>
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
				{ userCanEdit && (
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
				) }
				{ ! userCanEdit &&
					( excerpt ||
						postContentExcerpt ||
						__( 'No post excerpt found' ) ) }
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
