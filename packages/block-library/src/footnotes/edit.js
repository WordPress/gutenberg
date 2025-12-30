/**
 * WordPress dependencies
 */
import { useEffect, useMemo, useRef } from '@wordpress/element';
import { BlockIcon, RichText, useBlockProps } from '@wordpress/block-editor';
import { useEntityProp } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { Placeholder } from '@wordpress/components';
import { formatListNumbered as icon } from '@wordpress/icons';

export default function FootnotesEdit( {
	attributes,
	setAttributes,
	context: { postType, postId },
} ) {
	const [ meta, updateMeta ] = useEntityProp(
		'postType',
		postType,
		'meta',
		postId
	);
	const footnotesSupported = 'string' === typeof meta?.footnotes;

	// Get footnotes from block attributes or meta
	const hasBlockAttributes =
		attributes?.footnotes &&
		Array.isArray( attributes.footnotes ) &&
		attributes.footnotes.length > 0;
	const hasMetaFootnotes = meta?.footnotes;

	const footnotes = useMemo( () => {
		if ( hasBlockAttributes ) {
			// Create a deep copy to avoid mutating the original array
			return attributes.footnotes.map( ( fn ) => ( { ...fn } ) );
		}
		if ( hasMetaFootnotes ) {
			return JSON.parse( meta.footnotes );
		}
		return [];
	}, [
		hasBlockAttributes,
		hasMetaFootnotes,
		attributes?.footnotes,
		meta?.footnotes,
	] );

	// Track if migration has been attempted to prevent infinite loops
	const migrationAttempted = useRef( false );

	// Migrate footnotes from meta to block attributes on first access
	useEffect( () => {
		if (
			! hasBlockAttributes &&
			hasMetaFootnotes &&
			footnotes.length > 0 &&
			! migrationAttempted.current
		) {
			// eslint-disable-next-line react-compiler/react-compiler
			migrationAttempted.current = true;
			setAttributes( {
				footnotes,
			} );
			// Also update meta during transition period for backward compatibility
			if ( footnotesSupported ) {
				updateMeta( {
					...meta,
					footnotes: meta.footnotes,
				} );
			}
		}
	}, [
		hasBlockAttributes,
		hasMetaFootnotes,
		footnotes,
		setAttributes,
		footnotesSupported,
		meta,
		updateMeta,
	] );

	const blockProps = useBlockProps();

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

	if ( ! footnotes.length ) {
		return (
			<div { ...blockProps }>
				<Placeholder
					icon={ <BlockIcon icon={ icon } /> }
					label={ __( 'Footnotes' ) }
					instructions={ __(
						'Footnotes found in blocks within this document will be displayed here.'
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
						onChange={ ( nextFootnote ) => {
							const updatedFootnotes = footnotes.map(
								( footnote ) => {
									return footnote.id === id
										? {
												content: nextFootnote,
												id,
										  }
										: footnote;
								}
							);

							// Update block attributes (primary)
							setAttributes( {
								footnotes: updatedFootnotes,
							} );

							// Also update meta during transition period for backward compatibility
							if ( footnotesSupported ) {
								updateMeta( {
									...meta,
									footnotes:
										JSON.stringify( updatedFootnotes ),
								} );
							}
						} }
					/>{ ' ' }
					<a href={ `#${ id }-link` }>↩︎</a>
				</li>
			) ) }
		</ol>
	);
}
