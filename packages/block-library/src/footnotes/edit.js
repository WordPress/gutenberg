/**
 * WordPress dependencies
 */
import { BlockIcon, RichText, useBlockProps } from '@wordpress/block-editor';
import { useEntityProp } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { Placeholder } from '@wordpress/components';
import { formatListNumbered as icon } from '@wordpress/icons';

export default function FootnotesEdit( { context: { postType, postId } } ) {
	const [ meta, updateMeta ] = useEntityProp(
		'postType',
		postType,
		'meta',
		postId
	);
	const footnotes = meta?.footnotes ? JSON.parse( meta.footnotes ) : [];
	const blockProps = useBlockProps();

	if ( postType !== 'post' && postType !== 'page' ) {
		return (
			<div { ...blockProps }>
				<Placeholder
					icon={ <BlockIcon icon={ icon } /> }
					label={ __( 'Footnotes' ) }
					// To do: add instructions. We can't add new string in RC.
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
				<li key={ id }>
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
							updateMeta( {
								...meta,
								footnotes: JSON.stringify(
									footnotes.map( ( footnote ) => {
										return footnote.id === id
											? {
													content: nextFootnote,
													id,
											  }
											: footnote;
									} )
								),
							} );
						} }
					/>{ ' ' }
					<a href={ `#${ id }-link` }>↩︎</a>
				</li>
			) ) }
		</ol>
	);
}
