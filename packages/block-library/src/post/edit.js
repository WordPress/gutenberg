/**
 * WordPress dependencies
 */
import { useState, useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import {
	Placeholder,
	TextControl,
	Button,
	Spinner,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { EntityHandlers } from '@wordpress/editor';

export default function PostEdit( { attributes: { postId }, setAttributes } ) {
	const [ placeholderPostId, setPlaceholderPostId ] = useState();
	const onPostIdSubmit = useCallback( ( event ) => {
		event.preventDefault();

		const value = event.currentTarget[ 0 ].value;
		if ( ! value ) {
			return;
		}

		setAttributes( { postId: Number( value ) } );
	}, [] );

	const entity = useSelect(
		( select ) =>
			postId && select( 'core' ).getEntityRecord( 'postType', 'post', postId ),
		[ postId ]
	);

	if ( ! postId ) {
		return (
			<Placeholder
				label={ __( 'Post' ) }
				instructions={ __( 'Load a post.' ) }
				isColumnLayout
			>
				<form
					className="wp-block-post__placeholder-form"
					onSubmit={ onPostIdSubmit }
				>
					<TextControl
						type="number"
						label={ __( 'Post ID' ) }
						value={ placeholderPostId }
						onChange={ setPlaceholderPostId }
						className="wp-block-post__placeholder-input"
					/>
					<Button isDefault type="submit">
						{ __( 'Submit' ) }
					</Button>
				</form>
			</Placeholder>
		);
	}

	return entity ? (
		<EntityHandlers entity={ entity } />
	) : (
		<Placeholder>
			<Spinner />
		</Placeholder>
	);
}
