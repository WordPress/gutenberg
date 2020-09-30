/**
 * External dependencies
 */
import { isEmpty, map, some } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { SelectControl, Placeholder } from '@wordpress/components';
import { BlockIcon } from '@wordpress/block-editor';
import { brush } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';

export default function LegacyWidgetPlaceholder( {
	availableLegacyWidgets,
	currentWidget,
	hasPermissionsToManageWidgets,
	onChangeWidget,
} ) {
	const blocksByClientId = useSelect( ( select ) =>
		select( 'core/block-editor' ).getBlocksByClientId(
			select( 'core/block-editor' ).getClientIdsWithDescendants()
		)
	);

	const visibleLegacyWidgets = useMemo( () => {
		const visible = {};
		for ( const widgetName in availableLegacyWidgets ) {
			const {
				isReferenceWidget,
				blockName,
				isHidden,
			} = availableLegacyWidgets[ widgetName ];
			if ( isHidden ) {
				continue;
			}
			if ( isReferenceWidget ) {
				const blockExists = some( blocksByClientId, {
					name: blockName,
				} );
				if ( blockExists ) {
					continue;
				}
			}
			visible[ widgetName ] = availableLegacyWidgets[ widgetName ];
		}
		return visible;
	}, [ availableLegacyWidgets, blocksByClientId ] );

	let placeholderContent;
	if ( ! hasPermissionsToManageWidgets ) {
		placeholderContent = __(
			"You don't have permissions to use widgets on this site."
		);
	} else if ( isEmpty( visibleLegacyWidgets ) ) {
		placeholderContent = __( 'There are no widgets available.' );
	} else {
		placeholderContent = (
			<SelectControl
				label={ __( 'Select a legacy widget to display:' ) }
				value={ currentWidget || 'none' }
				onChange={ onChangeWidget }
				options={ [ { value: 'none', label: 'Select widget' } ].concat(
					map( visibleLegacyWidgets, ( widget, key ) => {
						return {
							value: key,
							label: widget.name,
						};
					} )
				) }
			/>
		);
	}
	return (
		<Placeholder
			icon={ <BlockIcon icon={ brush } /> }
			label={ __( 'Legacy Widget' ) }
		>
			{ placeholderContent }
		</Placeholder>
	);
}
