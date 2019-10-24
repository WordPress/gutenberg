/**
 * WordPress dependencies
 */
import {
	useEntityId,
	useEntityProp,
	__experimentalUseEntitySaving,
} from '@wordpress/core-data';
import { useCallback } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { RichText } from '@wordpress/block-editor';
import { cleanForSlug } from '@wordpress/editor';

const saveProps = [ 'title', 'slug' ];
export default function PostTitleEdit() {
	const postId = useEntityId( 'postType', 'post' );
	const [ title, _setTitle ] = useEntityProp( 'postType', 'post', 'title' );
	const [ , setSlug ] = useEntityProp( 'postType', 'post', 'slug' );
	const [ isDirty, isSaving, save ] = __experimentalUseEntitySaving(
		'postType',
		'post',
		saveProps
	);
	const setTitle = useCallback( ( value ) => {
		_setTitle( value );
		setSlug( cleanForSlug( value ) );
	}, [] );
	return postId ? (
		<>
			<Button
				isPrimary
				className="wp-block-custom-entity__save-button"
				disabled={ ! isDirty || ! title }
				isBusy={ isSaving }
				onClick={ save }
			>
				{ __( 'Update' ) }
			</Button>
			<RichText
				tagName="h1"
				placeholder={ __( 'Title' ) }
				value={ title }
				onChange={ setTitle }
				allowedFormats={ [] }
			/>
		</>
	) : (
		'Post Title Placeholder'
	);
}
