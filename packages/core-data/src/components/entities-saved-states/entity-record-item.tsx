import {
	CheckboxControl as WCCheckboxControl,
	PanelRow,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { STORE_NAME } from '../../name';
import { getTemplateInfo } from '../../utils/get-template-info';
import type { store as coreStore } from '../../';
import type { EntityRecordItemProps } from './types';
import type { TemplateInfoParams } from '../../utils/types';

export default function EntityRecordItem( {
	record,
	checked,
	onChange,
}: EntityRecordItemProps ) {
	const { name, kind, title, key } = record;

	// Handle templates that might use default descriptive titles.
	const { entityRecordTitle } = useSelect(
		( select ) => {
			if ( 'postType' !== kind || 'wp_template' !== name ) {
				return {
					entityRecordTitle: title,
				};
			}

			const template = // The store is selected by name, which carries no store types.
				select(
					STORE_NAME as unknown as typeof coreStore
				).getEditedEntityRecord( kind, name, key );

			const { default_template_types: templateTypes = [] } =
				// The store is selected by name, which carries no store types.
				select(
					STORE_NAME as unknown as typeof coreStore
				).getCurrentTheme() ?? {};

			return {
				entityRecordTitle: getTemplateInfo( {
					// A missing record is `false`, whose fields read as `undefined`.
					template:
						template as unknown as TemplateInfoParams[ 'template' ],
					templateTypes,
				} ).title,
			};
		},
		[ name, kind, title, key ]
	);

	return (
		<>
			<PanelRow>
				<WCCheckboxControl
					label={
						// `decodeEntities` returns a missing title as is.
						decodeEntities( entityRecordTitle as string ) ||
						__( 'Untitled' )
					}
					checked={ checked }
					onChange={ onChange }
					className="entities-saved-states__change-control"
				/>
			</PanelRow>
		</>
	);
}
