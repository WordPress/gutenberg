import { Spinner } from '@wordpress/components';
import { SelectControl } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';

export default function WidgetTypeSelector( { selectedId, onSelect } ) {
	const widgetTypes = useSelect( ( select ) => {
		const hiddenIds =
			select( blockEditorStore ).getSettings()
				?.widgetTypesToHideFromLegacyWidgetBlock ?? [];
		return select( coreStore )
			.getWidgetTypes( { per_page: -1 } )
			?.filter( ( widgetType ) => ! hiddenIds.includes( widgetType.id ) );
	}, [] );

	if ( ! widgetTypes ) {
		return <Spinner />;
	}

	if ( widgetTypes.length === 0 ) {
		return __( 'There are no widgets available.' );
	}

	const items = [
		{ value: '', label: __( 'Select widget' ) },
		...widgetTypes.map( ( widgetType ) => ( {
			value: widgetType.id,
			label: widgetType.name,
		} ) ),
	];

	return (
		<SelectControl
			label={ __( 'Legacy widget' ) }
			value={
				items.find( ( item ) => item.value === selectedId ) ??
				items[ 0 ]
			}
			items={ items }
			onValueChange={ ( item ) => {
				const value = item?.value;
				if ( value ) {
					const selected = widgetTypes.find(
						( widgetType ) => widgetType.id === value
					);
					onSelect( {
						selectedId: selected.id,
						isMulti: selected.is_multi,
					} );
				} else {
					onSelect( { selectedId: null } );
				}
			} }
		/>
	);
}
