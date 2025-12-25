/**
 * WordPress dependencies
 */
import { BlockIcon, RichText, useBlockProps } from '@wordpress/block-editor';
import { useEntityProp } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { Placeholder } from '@wordpress/components';
import { formatListNumbered as icon } from '@wordpress/icons';
import { useState, useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

export default function FootnotesEdit( {
	context,
	attributes,
	setAttributes,
} ) {
	// Fallback context detection using current post.
	const currentPost = useSelect(
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		( select ) => select( 'core/editor' ).getCurrentPost(),
		[]
	);
	const currentPostId = currentPost?.id;
	const currentPostType = currentPost?.type || 'post';

	// Prioritize passed context, then fallback to detected context.
	const postType = context?.postType || currentPostType;
	const postId = context?.postId || currentPostId;

	const [ meta, updateMeta ] = useEntityProp(
		'postType',
		postType,
		'meta',
		postId
	);

	const [ footnotes, setFootnotes ] = useState( () => {
		const sources = [
			attributes.footnotes,
			meta?.footnotes ? JSON.parse( meta.footnotes ) : null,
			[],
		];

		const validSource = sources.find(
			( source ) => Array.isArray( source ) && source.length > 0
		);

		return validSource || [];
	} );

	useEffect( () => {
		setAttributes( { footnotes } );
	}, [ footnotes, setAttributes ] );

	const footnotesSupported = 'string' === typeof meta?.footnotes;
	const blockProps = useBlockProps();

	const handleFootnoteChange = ( nextFootnote, id ) => {
		const updatedFootnotes = footnotes.map( ( footnote ) =>
			footnote.id === id
				? { ...footnote, content: nextFootnote }
				: footnote
		);

		setFootnotes( updatedFootnotes );

		if ( meta ) {
			try {
				updateMeta( {
					...meta,
					footnotes: JSON.stringify( updatedFootnotes ),
				} );
			} catch ( error ) {
				// Silent error handling.
			}
		}
	};

	if ( ! footnotesSupported ) {
		return (
			<div { ...blockProps }>
				<Placeholder
					icon={ <BlockIcon icon={ icon } /> }
					label={ __( 'Footnotes' ) }
					instructions={ __(
						'Footnotes are not supported here. Add this block to post or page content.'
					) }
				/>
			</div>
		);
	}

	if ( ! footnotes || footnotes.length === 0 ) {
		return (
			<div { ...blockProps }>
				<Placeholder
					icon={ <BlockIcon icon={ icon } /> }
					label={ __( 'Footnotes' ) }
					instructions={ __(
						'No footnotes available. Click below to add your first footnote.'
					) }
				/>
			</div>
		);
	}

	return (
		<ol { ...blockProps }>
			{ footnotes.map( ( { id, content } ) => (
				/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */
				<li
					key={ id }
					onMouseDown={ ( event ) => {
						// When clicking on the list item (not on descendants),
						// focus the rich text element since it's only 1px wide when
						// empty.
						if ( event.target === event.currentTarget ) {
							event.target.firstElementChild.focus();
							event.preventDefault();
						}
					} }
				>
					<RichText
						id={ id }
						tagName="span"
						value={ content }
						identifier={ id }
						// To do: figure out why the browser is not scrolling
						// into view when it receives focus.
						onFocus={ ( event ) => {
							if ( ! event.target.textContent.trim() ) {
								event.target.scrollIntoView();
							}
						} }
						onChange={ ( nextFootnote ) =>
							handleFootnoteChange( nextFootnote, id )
						}
						placeholder={ __( 'Enter footnote text' ) }
					/>{ ' ' }
					<a href={ `#${ id }-link` }>↩︎</a>
				</li>
			) ) }
		</ol>
	);
}
