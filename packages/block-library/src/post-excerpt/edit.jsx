import clsx from 'clsx';
import { store as coreStore } from '@wordpress/core-data';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import {
	InspectorControls,
	RichText,
	Warning,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	ToggleControl,
	RangeControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { useDebounce } from '@wordpress/compose';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import {
	useCanEditEntity,
	useToolsPanelDropdownMenuProps,
} from '../utils/hooks';
import useDeprecatedTextAlign from '../utils/deprecated-text-align-attributes';

const ELLIPSIS = '…';

/**
 * Requests the excerpt the server generates for a given length.
 *
 * `getEntityRecord` is deliberately not used here. It caches a single record by
 * ID and context and ignores the rest of the query, so every requested length
 * would share one cache entry: the response for one length would be displayed
 * for another, and a length that had already been resolved once would never be
 * requested again, leaving the block showing whichever length was fetched last.
 * Generated excerpts are therefore kept in state keyed by their request.
 *
 * Only `excerpt.rendered` is read, which the REST API builds the same way in
 * every context, so the request asks for the least privileged one.
 *
 * @param {string}           postType  Post type of the post to request.
 * @param {number|string}    postId    ID of the post to request.
 * @param {number}           length    Excerpt length to request.
 * @param {boolean}          isEnabled Whether an excerpt has to be generated.
 * @param {string|undefined} modified  Changes whenever the stored post changes.
 *
 * @return {string|undefined} The generated excerpt, or `undefined` while the
 *                            request for the current length is in flight.
 */
function useGeneratedExcerpt( postType, postId, length, isEnabled, modified ) {
	const baseURL = useSelect(
		( select ) =>
			select( coreStore ).getEntityConfig( 'postType', postType )
				?.baseURL,
		[ postType ]
	);
	const [ generatedExcerpts, setGeneratedExcerpts ] = useState( {} );

	const key =
		isEnabled && baseURL
			? `${ postId }|${ modified }|${ length }`
			: undefined;
	const isRequested = key !== undefined && key in generatedExcerpts;

	useEffect( () => {
		if ( key === undefined || isRequested ) {
			return;
		}

		let isStale = false;

		apiFetch( {
			path: addQueryArgs( `${ baseURL }/${ postId }`, {
				context: 'view',
				_fields: 'excerpt',
				excerpt_length: length,
			} ),
		} )
			.then( ( post ) => {
				if ( ! isStale ) {
					setGeneratedExcerpts( ( state ) => ( {
						...state,
						[ key ]: post?.excerpt?.rendered ?? '',
					} ) );
				}
			} )
			.catch( () => {
				// Keep displaying the excerpt already loaded for the post.
			} );

		return () => {
			isStale = true;
		};
	}, [ key, isRequested, baseURL, postId, length ] );

	return key === undefined ? undefined : generatedExcerpts[ key ];
}

export default function PostExcerptEditor( props ) {
	const {
		attributes: { moreText, showMoreOnNewLine, excerptLength },
		setAttributes,
		isSelected,
		context: { postId, postType, queryId },
	} = props;
	useDeprecatedTextAlign( props );

	const isDescendentOfQueryLoop = Number.isFinite( queryId );
	const userCanEdit = useCanEditEntity( 'postType', postType, postId );

	const { editEntityRecord } = useDispatch( coreStore );
	const setExcerpt = useCallback(
		( newValue ) => {
			void editEntityRecord( 'postType', postType, postId, {
				excerpt: newValue,
			} );
		},
		[ editEntityRecord, postType, postId ]
	);

	const { record, rawExcerpt } = useSelect(
		( select ) => {
			const _record = select( coreStore ).getEntityRecord(
				'postType',
				postType,
				postId
			);
			const editedRecord = select( coreStore ).getEditedEntityRecord(
				'postType',
				postType,
				postId
			);

			return {
				record: _record,
				rawExcerpt:
					_record && editedRecord ? editedRecord.excerpt : null,
			};
		},
		[ postType, postId ]
	);

	/*
	 * `excerpt_length` only changes the response for posts without a stored
	 * excerpt: `wp_trim_excerpt()` returns a stored excerpt untouched and
	 * applies the filter only while generating one from the post content.
	 * Posts that have an excerpt therefore reuse the record the editor has
	 * already loaded instead of spending a request per length on a response
	 * that cannot differ. An excerpt that has been edited but not yet stored
	 * is displayed as typed, so it does not need a generated excerpt either.
	 */
	const needsGeneratedExcerpt =
		!! record && ! record.excerpt?.raw?.trim() && ! rawExcerpt?.trim();

	/*
	 * The excerpt length is sent to the REST API so that the excerpt is
	 * trimmed on the server, using the same filters that run on the front end.
	 * Dragging the range control would otherwise trigger a request for every
	 * intermediate value, so the length used for the request is debounced.
	 * The control itself and the client-side trimming below keep using the
	 * attribute directly, so the UI stays responsive while dragging.
	 */
	const [ requestedExcerptLength, setRequestedExcerptLength ] =
		useState( excerptLength );
	const debouncedSetRequestedExcerptLength = useDebounce(
		setRequestedExcerptLength,
		300
	);
	useEffect( () => {
		debouncedSetRequestedExcerptLength( excerptLength );
	}, [ excerptLength, debouncedSetRequestedExcerptLength ] );

	const generatedExcerpt = useGeneratedExcerpt(
		postType,
		postId,
		requestedExcerptLength,
		needsGeneratedExcerpt,
		record?.modified_gmt
	);

	/*
	 * While a request is in flight the excerpt already loaded for the post is
	 * displayed, so that changing the length never blanks the block.
	 */
	const renderedExcerpt = needsGeneratedExcerpt
		? generatedExcerpt ?? record?.excerpt?.rendered
		: record?.excerpt?.rendered;
	const isProtected = record?.excerpt?.protected;

	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

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

	const blockProps = useBlockProps();

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
			<div { ...blockProps }>
				<p>{ __( 'This block will display the excerpt.' ) }</p>
			</div>
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
			.split( /\s+/, excerptLength )
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
			allowedFormats={ [] }
			preserveWhiteSpace
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
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () => {
						setAttributes( {
							showMoreOnNewLine: true,
							excerptLength: 55,
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						hasValue={ () => showMoreOnNewLine !== true }
						label={ __( 'Show link on new line' ) }
						onDeselect={ () =>
							setAttributes( { showMoreOnNewLine: true } )
						}
						isShownByDefault
					>
						<ToggleControl
							label={ __( 'Show link on new line' ) }
							checked={ showMoreOnNewLine }
							onChange={ ( newShowMoreOnNewLine ) =>
								setAttributes( {
									showMoreOnNewLine: newShowMoreOnNewLine,
								} )
							}
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						hasValue={ () => excerptLength !== 55 }
						label={ __( 'Max number of words' ) }
						onDeselect={ () =>
							setAttributes( { excerptLength: 55 } )
						}
						isShownByDefault
					>
						<RangeControl
							label={ __( 'Max number of words' ) }
							value={ excerptLength }
							onChange={ ( value ) => {
								setAttributes( { excerptLength: value } );
							} }
							min="10"
							max="100"
						/>
					</ToolsPanelItem>
				</ToolsPanel>
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
