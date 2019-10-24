/**
 * WordPress dependencies
 */
import {
	useEntityProp,
	__experimentalUseEntitySaving,
} from '@wordpress/core-data';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { RichText } from '@wordpress/block-editor';
import { cleanForSlug } from '@wordpress/editor';

const saveProps = [ 'title', 'slug' ];
export default function PostTitleEdit() {
	const [ title, setTitle ] = useEntityProp( 'postType', 'post', 'title' );
	const [ , setSlug ] = useEntityProp( 'postType', 'post', 'slug' );
	const [ isDirty, isSaving, save ] = __experimentalUseEntitySaving(
		'postType',
		'post',
		saveProps
	);
	return (
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
				onChange={ ( value ) => {
					setTitle( value );
					setSlug( cleanForSlug( value ) );
				} }
				allowedFormats={ [] }
			/>
		</>
	);
}
