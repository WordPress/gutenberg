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
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { getTemplateInfo } from '../../utils/get-template-info';

export default function EntityRecordItem( { record, checked, onChange } ) {
	const { name, kind, title, key } = record;

	// Handle templates that might use default descriptive titles.
	const { entityRecordTitle, hasPostMetaChanges } = useSelect(
		( select ) => {
			if ( 'postType' !== kind || 'wp_template' !== name ) {
				return {
					entityRecordTitle: title,
					hasPostMetaChanges: unlock(
						select( editorStore )
					).hasPostMetaChanges( name, key ),
				};
			}

			const template = select( coreStore ).getEditedEntityRecord(
				kind,
				name,
				key
			);

			const { default_template_types: templateTypes = [] } =
				select( coreStore ).getEntityRecord(
					'root',
					'__unstableBase'
				) ?? {};

			return {
				entityRecordTitle: getTemplateInfo( {
					template,
					templateTypes,
				} ).title,
				hasPostMetaChanges: unlock(
					select( editorStore )
				).hasPostMetaChanges( name, key ),
			};
		},
		[ name, kind, title, key ]
	);

	return (
		<>
			<PanelRow>
				<CheckboxControl
					__nextHasNoMarginBottom
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
