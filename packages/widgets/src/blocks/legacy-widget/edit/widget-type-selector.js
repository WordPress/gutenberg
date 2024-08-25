/**
 * WordPress dependencies
 */
import { Spinner, SelectControl } from '@wordpress/components';
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

	return (
		<SelectControl
			// TODO: Switch to `true` (40px size) if possible
			__next40pxDefaultSize={ false }
			__nextHasNoMarginBottom
			label={ __( 'Select a legacy widget to display:' ) }
			value={ selectedId ?? '' }
			options={ [
				{ value: '', label: __( 'Select widget' ) },
				...widgetTypes.map( ( widgetType ) => ( {
					value: widgetType.id,
					label: widgetType.name,
				} ) ),
			] }
			onChange={ ( value ) => {
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
