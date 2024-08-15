/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';
import {
	AlignmentToolbar,
	BlockControls,
	InspectorControls,
	RichText,
	Warning,
	useBlockProps,
} from '@wordpress/block-editor';
import { PanelBody, ToggleControl, RangeControl } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useCanEditEntity } from '../utils/hooks';

const ELLIPSIS = '…';

export default function PostExcerptEditor( {
	attributes: { textAlign, moreText, showMoreOnNewLine, excerptLength },
	setAttributes,
	isSelected,
	context: { postId, postType, queryId },
} ) {
	const isDescendentOfQueryLoop = Number.isFinite( queryId );
	const userCanEdit = useCanEditEntity( 'postType', postType, postId );
	const [
		rawExcerpt,
		setExcerpt,
		{ rendered: renderedExcerpt, protected: isProtected } = {},
	] = useEntityProp( 'postType', postType, 'excerpt', postId );

	/**
	 * Check if the post type supports excerpts.
	 * Add an exception and return early for the "page" post type,
	 * which is registered without support for the excerpt UI,
	 * but supports saving the excerpt to the database.
	 * See: https://core.trac.wordpress.org/browser/branches/6.1/src/wp-includes/post.php#L65
	 * Without this exception, users that have excerpts saved to the database will
	 * not be able to edit the excerpts.
	 */
	const postTypeSupportsExcerpts = useSelect(
		( select ) => {
			if ( postType === 'page' ) {
				return true;
			}
			return !! select( coreStore ).getPostType( postType )?.supports
				?.excerpt;
		},
		[ postType ]
	);

	/**
	 * The excerpt is editable if:
	 * - The user can edit the post
	 * - It is not a descendent of a Query Loop block
	 * - The post type supports excerpts
	 */
	const isEditable =
		userCanEdit && ! isDescendentOfQueryLoop && postTypeSupportsExcerpts;

	const blockProps = useBlockProps( {
		className: clsx( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	/**
	 * translators: If your word count is based on single characters (e.g. East Asian characters),
	 * enter 'characters_excluding_spaces' or 'characters_including_spaces'. Otherwise, enter 'words'.
	 * Do not translate into your own language.
	 */
	const wordCountType = _x( 'words', 'Word count type. Do not translate!' );

	/**
	 * When excerpt is editable, strip the html tags from
	 * rendered excerpt. This will be used if the entity's
	 * excerpt has been produced from the content.
	 */
	const strippedRenderedExcerpt = useMemo( () => {
		if ( ! renderedExcerpt ) {
			return '';
		}
		const document = new window.DOMParser().parseFromString(
			renderedExcerpt,
			'text/html'
		);
		return document.body.textContent || document.body.innerText || '';
	}, [ renderedExcerpt ] );

	if ( ! postType || ! postId ) {
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
				<div { ...blockProps }>
					<p>{ __( 'This block will display the excerpt.' ) }</p>
				</div>
			</>
		);
	}
	if ( isProtected && ! userCanEdit ) {
		return (
			<div { ...blockProps }>
				<Warning>
					{ __(
						'The content is currently protected and does not have the available excerpt.'
					) }
				</Warning>
			</div>
		);
	}
	const readMoreLink = (
		<RichText
			identifier="moreText"
			className="wp-block-post-excerpt__more-link"
			tagName="a"
			aria-label={ __( '“Read more” link text' ) }
			placeholder={ __( 'Add "read more" link text' ) }
			value={ moreText }
			onChange={ ( newMoreText ) =>
				setAttributes( { moreText: newMoreText } )
			}
			withoutInteractiveFormatting
		/>
	);
	const excerptClassName = clsx( 'wp-block-post-excerpt__excerpt', {
		'is-inline': ! showMoreOnNewLine,
	} );

	/**
	 * The excerpt length setting needs to be applied to both
	 * the raw and the rendered excerpt depending on which is being used.
	 */
	const rawOrRenderedExcerpt = (
		rawExcerpt || strippedRenderedExcerpt
	).trim();

	let trimmedExcerpt = '';
	if ( wordCountType === 'words' ) {
		trimmedExcerpt = rawOrRenderedExcerpt
			.split( ' ', excerptLength )
			.join( ' ' );
	} else if ( wordCountType === 'characters_excluding_spaces' ) {
		/*
		 * 1. Split the excerpt at the character limit,
		 * then join the substrings back into one string.
		 * 2. Count the number of spaces in the excerpt
		 * by comparing the lengths of the string with and without spaces.
		 * 3. Add the number to the length of the visible excerpt,
		 * so that the spaces are excluded from the word count.
		 */
		const excerptWithSpaces = rawOrRenderedExcerpt
			.split( '', excerptLength )
			.join( '' );

		const numberOfSpaces =
			excerptWithSpaces.length -
			excerptWithSpaces.replaceAll( ' ', '' ).length;

		trimmedExcerpt = rawOrRenderedExcerpt
			.split( '', excerptLength + numberOfSpaces )
			.join( '' );
	} else if ( wordCountType === 'characters_including_spaces' ) {
		trimmedExcerpt = rawOrRenderedExcerpt
			.split( '', excerptLength )
			.join( '' );
	}

	const isTrimmed = trimmedExcerpt !== rawOrRenderedExcerpt;

	const excerptContent = isEditable ? (
		<RichText
			className={ excerptClassName }
			aria-label={ __( 'Excerpt text' ) }
			value={
				isSelected
					? rawOrRenderedExcerpt
					: ( ! isTrimmed
							? rawOrRenderedExcerpt
							: trimmedExcerpt + ELLIPSIS ) ||
					  __( 'No excerpt found' )
			}
			onChange={ setExcerpt }
			tagName="p"
		/>
	) : (
		<p className={ excerptClassName }>
			{ ! isTrimmed
				? rawOrRenderedExcerpt || __( 'No excerpt found' )
				: trimmedExcerpt + ELLIPSIS }
		</p>
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
				<PanelBody title={ __( 'Settings' ) }>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Show link on new line' ) }
						checked={ showMoreOnNewLine }
						onChange={ ( newShowMoreOnNewLine ) =>
							setAttributes( {
								showMoreOnNewLine: newShowMoreOnNewLine,
							} )
						}
					/>
					<RangeControl
						__nextHasNoMarginBottom
						label={ __( 'Max number of words' ) }
						value={ excerptLength }
						onChange={ ( value ) => {
							setAttributes( { excerptLength: value } );
						} }
						min="10"
						max="100"
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
