/**
 * External dependencies
 */
import { pickBy, isEmpty, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { SelectControl } from '@wordpress/components';

export default function WidgetSelectControl( {
	availableLegacyWidgets,
	currentWidget,
	onChange,
	label = __( 'Select a legacy widget to display:' ),
	emptyLabel = __( 'There are no widgets available.' ),
} ) {
	const usedReferenceWidgetNames = useSelect( ( select ) =>
		select( 'core/edit-widgets' )
			.getReferenceWidgetBlocks()
			.map( ( { attributes } ) => attributes?.referenceWidgetName )
	);
	const choosableLegacyWidgets = useMemo( () => {
		return pickBy(
			availableLegacyWidgets,
			// Filter out hidden widgets and already used reference widgets.
			( { isHidden }, referenceWidgetName ) =>
				! isHidden &&
				( ! referenceWidgetName ||
					! usedReferenceWidgetNames.includes( referenceWidgetName ) )
		);
	}, [ availableLegacyWidgets, usedReferenceWidgetNames ] );

	if ( isEmpty( choosableLegacyWidgets ) ) {
		return emptyLabel;
	}

	return (
		<SelectControl
			label={ label }
			value={ currentWidget || 'none' }
			onChange={ ( newWidget ) => {
				const {
					isReferenceWidget,
					id_base: idBase,
				} = availableLegacyWidgets[ newWidget ];

				if ( isReferenceWidget ) {
					onChange( {
						instance: {},
						idBase,
						referenceWidgetName: newWidget,
						widgetClass: undefined,
					} );
				} else {
					onChange( {
						instance: {},
						idBase,
						referenceWidgetName: undefined,
						widgetClass: newWidget,
					} );
				}
			} }
			options={ [ { value: 'none', label: 'Select widget' } ].concat(
				map( choosableLegacyWidgets, ( widget, key ) => {
					return {
						value: key,
						label: widget.name,
					};
				} )
			) }
		/>
	);
}
