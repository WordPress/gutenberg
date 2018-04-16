/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink, withInstanceId } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/element';

/**
 * Internal Dependencies
 */
import './style.scss';

function PostExcerpt( { excerpt, onUpdateExcerpt, instanceId } ) {
	const id = `editor-post-excerpt-${ instanceId }`;
	const onChange = ( event ) => onUpdateExcerpt( event.target.value );

	return (
		<div>
			<label key="label" htmlFor={ id }>{ __( 'Write an excerpt (optional)' ) }</label>
			<textarea
				id={ id }
				className="editor-post-excerpt__textarea"
				onChange={ onChange }
				value={ excerpt }
			/>
			<ExternalLink href="https://codex.wordpress.org/Excerpt">
				{ __( 'Learn more about manual excerpts' ) }
			</ExternalLink>
		</div>
	);
}

export default compose( [
	withSelect( ( select ) => {
		return {
			excerpt: select( 'core/editor' ).getEditedPostExcerpt(),
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		onUpdateExcerpt( excerpt ) {
			dispatch( 'core/editor' ).editPost( { excerpt } );
		},
	} ) ),
	withInstanceId,
] )( PostExcerpt );
