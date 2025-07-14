/**
 * WordPress dependencies
 */
import { Button, Spinner } from '@wordpress/components';
import { DataForm } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';

const useSiteSettings = ( optionName ) => {
	const { saveEntityRecord, editEntityRecord } = useDispatch( coreDataStore );

	const { record, editedEntities, isSaving } = useSelect( ( select ) => {
		const _record = select( coreDataStore ).getEntityRecord(
			'root',
			'site'
		);
		const edits = select( coreDataStore ).getEntityRecordEdits(
			'root',
			'site'
		);

		// we care only about settings under our optionName.
		return {
			record:
				_record && typeof _record[ optionName ] !== 'undefined'
					? _record[ optionName ]
					: null,
			editedEntities:
				edits && typeof edits[ optionName ] !== 'undefined'
					? edits[ optionName ]
					: null,
			isSaving: select( coreDataStore ).isSavingEntityRecord(
				'root',
				'site'
			),
		};
	} );

	const mergedData = { ...record, ...editedEntities };

	const getSetting = ( settingId ) => {
		if (
			isSaving ||
			typeof mergedData === 'undefined' ||
			Object.keys( mergedData ).length < 1
		) {
			return null;
		}

		if ( typeof mergedData[ settingId ] === 'undefined' ) {
			return null;
		}

		return mergedData[ settingId ];
	};

	const setSetting = ( settingId, value ) => {
		const edits = {
			[ optionName ]: {
				...mergedData, // @TODO meh
				[ settingId ]: value,
			},
		};
		editEntityRecord( 'root', 'site', undefined, edits );
	};

	const setSettings = ( values ) => {
		const edits = {
			[ optionName ]: {
				...mergedData,
				...values,
			},
		};
		editEntityRecord( 'root', 'site', undefined, edits );
	};

	const saveSettings = () => {
		return saveEntityRecord( 'root', 'site', {
			[ optionName ]: mergedData,
		} );
	};

	return {
		saveSettings,
		getSetting,
		settings: mergedData,
		setSetting,
		setSettings,
		isSaving,
		hasChanges: Object.keys( editedEntities || {} ).length > 0,
	};
};

/**
 * Internal dependencies
 */
import Page from '../page';

export default function ExperimentsPage() {
	const { saveSettings, settings, setSettings, isSaving, hasChanges } =
		useSiteSettings( 'gutenberg-experiments' );

	if ( ! settings ) {
		return <Spinner />;
	}

	return (
		<Page
			title={ __( 'Experimental settings' ) }
			actions={
				<Button
					variant="primary"
					onClick={ () => {
						saveSettings();
					} }
					__next40pxDefaultSize
					disabled={ ! hasChanges || isSaving }
					accessibleWhenDisabled
					isBusy={ isSaving }
				>
					{ __( 'Save' ) }
				</Button>
			}
		>
			<div className="experiments-page__form">
				<DataForm
					data={ settings }
					fields={ [
						{
							Edit: 'checkbox',
							id: 'gutenberg-block-experiments',
							label: __( 'Add experimental blocks' ),
							description: __(
								'Enables experimental blocks on a rolling basis as they are developed. (Warning: these blocks may have significant changes during development that cause validation errors and display issues.)'
							),
							type: 'boolean',
						},
						{
							Edit: 'checkbox',
							id: 'gutenberg-form-blocks',
							label: __( 'Add Form and input blocks' ),
							description: __(
								'Enables new blocks to allow building forms. You are likely to experience UX issues that are being addressed.'
							),
							type: 'boolean',
						},
						{
							Edit: 'checkbox',
							id: 'gutenberg-grid-interactivity',
							label: __( 'Add Grid interactivity' ),
							description: __(
								'Enables enhancements to the Grid block that let you move and resize items in the editor canvas.'
							),
							type: 'boolean',
						},
						{
							Edit: 'checkbox',
							id: 'gutenberg-no-tinymce',
							label: __( 'Disable TinyMCE and Classic block' ),
							description: __(
								'Disables the TinyMCE and Classic block.'
							),
							type: 'boolean',
						},
						{
							Edit: 'checkbox',
							id: 'gutenberg-media-processing',
							label: __( 'Client-side media processing' ),
							description: __(
								"Enables client-side media processing to leverage the browser's capabilities to handle tasks like image resizing and compression."
							),
							type: 'boolean',
						},
						{
							Edit: 'checkbox',
							id: 'gutenberg-block-comments',
							label: __( 'Add block level comments' ),
							description: __(
								'Enables multi-user block level commenting.'
							),
							type: 'boolean',
						},
						{
							Edit: 'checkbox',
							id: 'gutenberg-sync-collaboration',
							label: __( 'Add real time editing' ),
							description: __(
								'Enables live collaboration and offline persistence between peers.'
							),
							type: 'boolean',
						},
						{
							Edit: 'checkbox',
							id: 'gutenberg-color-randomizer',
							label: __( 'Color randomizer' ),
							description: __(
								'Enables the Global Styles color randomizer in the Site Editor; a utility that lets you mix the current color palette pseudo-randomly.'
							),
							type: 'boolean',
						},
						{
							Edit: 'checkbox',
							id: 'gutenberg-custom-dataviews',
							label: __( 'Add Custom Views' ),
							description: __(
								'Enables the ability to add, edit, and save custom views when in the Site Editor.'
							),
							type: 'boolean',
						},
						{
							Edit: 'checkbox',
							id: 'gutenberg-new-posts-dashboard',
							label: __( 'Enable for Posts' ),
							description: __(
								'Enables a redesigned posts dashboard accessible through a submenu item in the Gutenberg plugin.'
							),
							type: 'boolean',
						},
						{
							Edit: 'checkbox',
							id: 'gutenberg-quick-edit-dataviews',
							label: __( 'Add Quick Edit' ),
							description: __(
								'Enables access to a Quick Edit panel in the Site Editor Pages experience.'
							),
							type: 'boolean',
						},
						{
							Edit: 'checkbox',
							id: 'gutenberg-editor-write-mode',
							label: __( 'Simplified site editing' ),
							description: __(
								'Enables Write mode in the Site Editor for a simplified editing experience.'
							),
							type: 'boolean',
						},
						{
							Edit: 'checkbox',
							id: 'gutenberg-full-page-client-side-navigation',
							label: __( 'Full-page client-side navigation' ),
							description: __(
								'Enables full-page client-side navigation, powered by the Interactivity API.'
							),
							type: 'boolean',
						},
					] }
					form={ {
						fields: [
							{
								id: 'gutenberg-experiments--blocks',
								label: 'Blocks',
								type: 'group',
								labelPosition: 'side',
								children: [
									'gutenberg-block-experiments',
									'gutenberg-form-blocks',
									'gutenberg-grid-interactivity',
									'gutenberg-no-tinymce',
								],
							},
							{
								id: 'gutenberg-experiments--media',
								label: 'Media',
								type: 'group',
								labelPosition: 'side',
								children: [ 'gutenberg-media-processing' ],
							},
							{
								id: 'gutenberg-experiments--collaboration',
								label: 'Collaboration',
								type: 'group',
								labelPosition: 'side',
								children: [
									'gutenberg-block-comments',
									'gutenberg-sync-collaboration',
								],
							},
							{
								id: 'gutenberg-experiments--data-views',
								label: 'Data Views',
								type: 'group',
								labelPosition: 'side',
								children: [
									'gutenberg-custom-dataviews',
									'gutenberg-new-posts-dashboard',
									'gutenberg-quick-edit-dataviews',
								],
							},
							{
								id: 'gutenberg-experiments--editor',
								label: 'Editor',
								type: 'group',
								labelPosition: 'side',
								children: [ 'gutenberg-editor-write-mode' ],
							},
							{
								id: 'gutenberg-experiments--interactivity',
								label: 'Interactivity',
								type: 'group',
								labelPosition: 'side',
								children: [
									'gutenberg-full-page-client-side-navigation',
								],
							},
							{
								id: 'gutenberg-experiments--other',
								label: 'Other',
								type: 'group',
								labelPosition: 'side',
								children: [ 'gutenberg-color-randomizer' ],
							},
						],
						labelPosition: 'side',
						type: 'regular',
					} }
					onChange={ ( values ) => {
						setSettings( values );
					} }
				/>
			</div>
		</Page>
	);
}
