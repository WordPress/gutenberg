/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	useEntityProp,
	__experimentalUseEntitySaving,
} from '@wordpress/core-data';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { RichText } from '@wordpress/block-editor';

export function SiteTitleEdit( { isSelected } ) {
	const canUpdate = useSelect( ( select ) => {
		return select( 'core' ).canUser( 'update', 'settings' );
	} );

	const [ title, setTitle ] = useEntityProp( 'root', 'site', 'title' );
	const [ isDirty, isSaving, save ] = __experimentalUseEntitySaving(
		'root',
		'site',
		'title'
	);

	const [ viewTitle ] = useEntityProp( 'root', 'base', 'name' );

	const editMode = (
		<>
			<Button
				isPrimary
				className="wp-block-site-title__save-button"
				disabled={ ! isDirty || ! title }
				isBusy={ isSaving }
				onClick={ save }
			>
				{ __( 'Update' ) }
			</Button>
			<RichText
				tagName="h1"
				placeholder={ __( 'Site Title' ) }
				value={ title }
				onChange={ setTitle }
				allowedFormats={ [] }
			/>
		</>
	);

	const viewMode = (
		<h1>{ title ? title : viewTitle }</h1>
	);

	return ( canUpdate && isSelected ) ? editMode : viewMode;
}

export default SiteTitleEdit;
