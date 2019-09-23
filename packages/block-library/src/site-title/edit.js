/**
 * WordPress dependencies
 */
import {
	useEntityProp,
	useEntitySaving,
	EntityProvider,
} from '@wordpress/core-data';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { RichText } from '@wordpress/block-editor';

function TitleInput() {
	const [ title, setTitle ] = useEntityProp( 'root', 'site', 'title' );
	const [ isDirty, isSaving, save ] = useEntitySaving( 'root', 'site', 'title' );
	return (
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
			/>
		</>
	);
}

export default function SiteTitleEdit() {
	return (
		<EntityProvider kind="root" type="site">
			<TitleInput />
		</EntityProvider>
	);
}
