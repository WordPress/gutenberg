/**
 * WordPress dependencies
 */
import { useEntityProp, useEntityId } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';
import { InspectorControls, RichText } from '@wordpress/block-editor';
import { PanelBody, RangeControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function usePostContentExcerpt( excerptLength ) {
	const [ , , { raw: rawPostContent } ] = useEntityProp(
		'postType',
		'post',
		'content'
	);
	return useMemo( () => {
		if ( ! rawPostContent ) {
			return '';
		}
		const excerptElement = document.createElement( 'div' );
		excerptElement.innerHTML = rawPostContent;
		const excerpt =
			excerptElement.textContent || excerptElement.innerText || '';
		return excerpt
			.trim()
			.split( ' ', excerptLength )
			.join( ' ' );
	}, [ rawPostContent, excerptLength ] );
}

function PostExcerptEditor( {
	attributes: { excerptLength, moreText, showMoreOnNewLine },
	setAttributes,
	isSelected,
} ) {
	const [ excerpt, setExcerpt ] = useEntityProp( 'postType', 'post', 'excerpt' );
	const postContentExcerpt = usePostContentExcerpt( excerptLength );
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Post Excerpt Settings' ) }>
					{ ! excerpt && (
						<RangeControl
							label={ __( 'Max words' ) }
							value={ excerptLength }
							onChange={ ( newExcerptLength ) =>
								setAttributes( { excerptLength: newExcerptLength } )
							}
							min={ 10 }
							max={ 100 }
						/>
					) }
					<ToggleControl
						label={ __( 'Show link on new line' ) }
						checked={ showMoreOnNewLine }
						onChange={ ( newShowMoreOnNewLine ) =>
							setAttributes( { showMoreOnNewLine: newShowMoreOnNewLine } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<RichText
				className={
					! showMoreOnNewLine && 'wp-block-post-excerpt__excerpt is-inline'
				}
				placeholder={ postContentExcerpt }
				value={ excerpt || ( isSelected ? '' : postContentExcerpt ) }
				onChange={ setExcerpt }
				keepPlaceholderOnFocus
			/>
			{ ! showMoreOnNewLine && ' ' }
			<RichText
				tagName="a"
				placeholder={ __( 'Read more…' ) }
				value={ moreText }
				onChange={ ( newMoreText ) => setAttributes( { moreText: newMoreText } ) }
			/>
		</>
	);
}

export default function PostExcerptEdit( {
	attributes,
	setAttributes,
	isSelected,
} ) {
	if ( ! useEntityId( 'postType', 'post' ) ) {
		return 'Post Excerpt Placeholder';
	}
	return (
		<PostExcerptEditor
			attributes={ attributes }
			setAttributes={ setAttributes }
			isSelected={ isSelected }
		/>
	);
}
