/**
 * WordPress dependencies
 */
import {
	useEntityProp,
	__experimentalUseEntitySaving,
} from '@wordpress/core-data';
import { RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { Disabled, Button } from '@wordpress/components';

export default function SiteTitleEdit() {
	const [ title, setTitle, titleIsLocked ] = useEntityProp(
		'root',
		'site',
		'title'
	);
	const [ isDirty, isSaving, save ] = __experimentalUseEntitySaving(
		'root',
		'site',
		'title'
	);

	const input = (
		<RichText
			tagName="h1"
			placeholder={ __( 'Site Title' ) }
			value={ title }
			onChange={ setTitle }
			allowedFormats={ [] }
		/>
	);
	return (
		<>
			<Button
				isPrimary
				className="wp-block-site-title__save-button"
				disabled={ ! isDirty || ! title || titleIsLocked }
				isBusy={ isSaving }
				onClick={ save }
			>
				{ __( 'Update' ) }
			</Button>
			{ titleIsLocked ? <Disabled>{ input }</Disabled> : input }
		</>
	);
}
