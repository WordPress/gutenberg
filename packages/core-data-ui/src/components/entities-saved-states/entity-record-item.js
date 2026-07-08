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
import { getTemplateInfo } from '../../utils/get-template-info';

export default function EntityRecordItem( { record, checked, onChange } ) {
	const { name, kind, title, key } = record;

	// Handle templates that might use default descriptive titles.
	const entityRecordTitle = useSelect(
		( select ) => {
			if ( 'postType' !== kind || 'wp_template' !== name ) {
				return title;
			}

			const template = select( coreStore ).getEditedEntityRecord(
				kind,
				name,
				key
			);

			const { default_template_types: templateTypes = [] } =
				select( coreStore ).getCurrentTheme() ?? {};

			return getTemplateInfo( {
				template,
				templateTypes,
			} ).title;
		},
		[ name, kind, title, key ]
	);

	return (
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
	);
}
