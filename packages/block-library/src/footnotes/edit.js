/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export default function Edit( { attributes, setAttributes, className } ) {
	const { footnotes } = attributes;

	if ( ! footnotes.length ) {
		return null;
	}

	return (
		<div className={ classnames( 'wp-block block-library-list', className, {
			'is-selected': footnotes.some( ( { isSelected } ) => isSelected ),
		} ) }>
			<ol>
				{ footnotes.map( ( { id, text, isSelected }, index ) =>
					<li
						key={ id }
						id={ id }
						className={ classnames( { 'is-selected': isSelected } ) }
					>
						<a
							href={ `#${ id }-anchor` }
							aria-label={ __( 'Back to content' ) }
							onClick={ () => {
								// This is a hack to get the target to focus.
								// The attribute will later be removed when selection is set.
								document.getElementById( `${ id }-anchor` ).contentEditable = 'false';
							} }
						>
							↑
						</a>
						{ ' ' }
						<input
							aria-label={ __( 'Note' ) }
							value={ text }
							onChange={ ( event ) => {
								setAttributes( {
									footnotes: footnotes.map( ( footnote, i ) => {
										if ( i !== index ) {
											return footnote;
										}

										return {
											...footnote,
											text: event.target.value,
										};
									} ),
								} );
							} }
							placeholder={ __( 'Footnote' ) }
						/>
					</li>
				) }
			</ol>
		</div>
	);
}
