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
			return select( editorStore ).__experimentalGetTemplateInfo(
				template
			).title;
		},
		[ name, kind, title, key ]
	);

	return (
		<PanelRow>
			<CheckboxControl
				__nextHasNoMarginBottom
				label={
					<strong>
						{ decodeEntities( entityRecordTitle ) ||
							__( 'Untitled' ) }
					</strong>
				}
				checked={ checked }
				onChange={ onChange }
			/>
		</PanelRow>
	);
}
