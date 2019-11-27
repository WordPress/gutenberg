/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import {
	useEntityProp,
	__experimentalUseEntitySaving,
} from '@wordpress/core-data';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { RichText } from '@wordpress/block-editor';

export function SiteTitleEdit( { canUpdate, isSelected } ) {
	const [ title, setTitle ] = useEntityProp( 'root', 'site', 'title' );
	const [ isDirty, isSaving, save ] = __experimentalUseEntitySaving(
		'root',
		'site',
		'title'
	);

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
		<h1>{ title }</h1>
	);

	return ( canUpdate && isSelected ) ? editMode : viewMode;
}

export default compose( [
	withSelect( ( select, {} ) => {
		const { canUser } = select( 'core' );
		return {
			canUpdate: canUser( 'update', 'settings' ),
		};
	} ),
] )( SiteTitleEdit );
