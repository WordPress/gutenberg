/**
 * WordPress dependencies
 */
import { CheckboxControl, PanelRow } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

export default function EntityRecordItem( { record, checked, onChange } ) {
	const { name, kind, title, key } = record;

	// Handle templates that might use default descriptive titles.
	const { entityRecordTitle = decodeEntities( title ), hasPostMetaChanges } =
		useSelect(
			( select ) => {
				const {
					getPostTitle,
					hasPostMetaChanges: _hasPostMetaChanges,
				} = unlock( select( editorStore ) );
				return {
					entityRecordTitle:
						kind === 'postType'
							? getPostTitle( kind, name, key )
							: undefined,
					hasPostMetaChanges:
						kind === 'postType'
							? _hasPostMetaChanges( name, key )
							: false,
				};
			},
			[ kind, name, key ]
		);

	return (
		<>
			<PanelRow>
				<CheckboxControl
					__nextHasNoMarginBottom
					label={ entityRecordTitle || __( 'No title' ) }
					checked={ checked }
					onChange={ onChange }
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
