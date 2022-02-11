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
import { PanelBody, ToggleControl, Disabled } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useCanEditEntity } from '../utils/hooks';

export default function PostExcerptEditor( {
	attributes: { textAlign, moreText, showMoreOnNewLine },
	setAttributes,
	isSelected,
	context: { postId, postType, queryId },
} ) {
	const isDescendentOfQueryLoop = Number.isFinite( queryId );
	const userCanEdit = useCanEditEntity( 'postType', postType, postId );
	const isEditable = userCanEdit && ! isDescendentOfQueryLoop;
	const [
		rawExcerpt,
		setExcerpt,
		{ rendered: renderedExcerpt, protected: isProtected } = {},
	] = useEntityProp( 'postType', postType, 'excerpt', postId );
	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );
	/**
	 * When excerpt is editable, strip the html tags from
	 * rendered excerpt. This will be used if the entity's
	 * excerpt has been produced from the content.
	 */
	const strippedRenderedExcerpt = useMemo( () => {
		if ( ! renderedExcerpt ) return '';
		const document = new window.DOMParser().parseFromString(
			renderedExcerpt,
			'text/html'
		);
		return document.body.textContent || document.body.innerText || '';
	}, [ renderedExcerpt ] );
	if ( ! postType || ! postId ) {
		return <div { ...blockProps }>{ __( 'Post Excerpt' ) }</div>;
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
			withoutInteractiveFormatting={ true }
		/>
	);
	let excerptContent = (
		<RichText
			className={ classnames( 'wp-block-post-excerpt__excerpt', {
				'is-inline': ! showMoreOnNewLine,
			} ) }
			aria-label={ __( 'Post excerpt text' ) }
			value={
				rawExcerpt ||
				strippedRenderedExcerpt ||
				( isSelected ? '' : __( 'No post excerpt found' ) )
			}
			onChange={ setExcerpt }
			tagName="p"
		/>
	);
	excerptContent = isEditable ? (
		excerptContent
	) : (
		<Disabled>{ excerptContent }</Disabled>
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
