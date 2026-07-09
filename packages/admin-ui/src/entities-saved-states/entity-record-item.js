/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal';

/**
 * WordPress dependencies
 */
import { CheckboxControl, PanelRow } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { getTemplateInfo } from '../utils/get-template-info';

export default function EntityRecordItem( { record, checked, onChange } ) {
	const { name, kind, title, key } = record;

	// Handle templates that might use default descriptive titles.
	const { entityRecordTitle, hasPostMetaChanges } = useSelect(
		( select ) => {
			const {
				getEditedEntityRecord,
				getCurrentTheme,
				getEntityRecordNonTransientEdits,
				getEntityRecord,
			} = select( coreStore );

			const metaEdits = getEntityRecordNonTransientEdits(
				'postType',
				name,
				key
			)?.meta;
			let metaChanged = false;
			if ( metaEdits ) {
				const originalMeta = getEntityRecord(
					'postType',
					name,
					key
				)?.meta;
				metaChanged = ! fastDeepEqual(
					{ ...originalMeta, footnotes: undefined },
					{ ...metaEdits, footnotes: undefined }
				);
			}

			if ( 'postType' !== kind || 'wp_template' !== name ) {
				return {
					entityRecordTitle: title,
					hasPostMetaChanges: metaChanged,
				};
			}

			const template = getEditedEntityRecord( kind, name, key );
			const { default_template_types: templateTypes = [] } =
				getCurrentTheme() ?? {};

			return {
				entityRecordTitle: getTemplateInfo( {
					template,
					templateTypes,
				} ).title,
				hasPostMetaChanges: metaChanged,
			};
		},
		[ name, kind, title, key ]
	);

	return (
		<>
			<PanelRow>
				<CheckboxControl
					label={
						decodeEntities( entityRecordTitle ) || __( 'Untitled' )
					}
					checked={ checked }
					onChange={ onChange }
					className="entities-saved-states__change-control"
				/>
			</PanelRow>
			{ hasPostMetaChanges && (
				<ul className="entities-saved-states__changes">
					<li>{ __( 'Post Meta.' ) }</li>
				</ul>
			) }
		</>
	);
}
