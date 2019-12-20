/**
 * External dependencies
 */
import { pickBy, isEmpty, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { SelectControl, Placeholder } from '@wordpress/components';
import { BlockIcon } from '@wordpress/block-editor';

export default function LegacyWidgetPlaceholder( {
	availableLegacyWidgets,
	currentWidget,
	hasPermissionsToManageWidgets,
	onChangeWidget,
} ) {
	const visibleLegacyWidgets = useMemo(
		() => pickBy(
			availableLegacyWidgets,
			( { isHidden } ) => ! isHidden
		),
		[ availableLegacyWidgets ]
	);
	let placeholderContent;
	if ( ! hasPermissionsToManageWidgets ) {
		placeholderContent = __( 'You don\'t have permissions to use widgets on this site.' );
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
			icon={ <BlockIcon icon="admin-customizer" /> }
			label={ __( 'Legacy Widget' ) }
		>
			{ placeholderContent }
		</Placeholder>
	);
}
