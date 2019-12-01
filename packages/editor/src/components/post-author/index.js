/**
 * WordPress dependencies
 */
import { __experimentalReadSelect, useDispatch } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { CustomSelect, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Suspense } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PostAuthorCheck from './check';

const authorId = __experimentalReadSelect( 'core/editor' ).getEditedPostAttribute(
	'author'
);
const authors = __experimentalReadSelect( 'core' ).getAuthors();
const PostAuthor = () => {
	authorId.useRead(); // Subscribe to changes.
	const { editPost } = useDispatch( 'core/editor' );
	const setAuthorId = ( { selectedItem: { key: author } } ) =>
		editPost( { author } );
	const items = authors
		.read()
		.map( ( author ) => ( { key: author.id, name: decodeEntities( author.name ) } ) );
	return (
		<PostAuthorCheck>
			<CustomSelect
				className="editor-post-author__select"
				label={ __( 'Author' ) }
				items={ items }
				onSelectedItemChange={ setAuthorId }
				selectedItem={ items.find( ( item ) => item.key === authorId.read() ) }
			/>
		</PostAuthorCheck>
	);
};

export default () => {
	return (
		<Suspense fallback={ <Spinner /> }>
			<PostAuthor />
		</Suspense>
	);
};
