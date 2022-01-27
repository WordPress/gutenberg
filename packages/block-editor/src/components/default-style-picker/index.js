/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import { useMemo, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { SelectControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { getDefaultStyle } from '../block-styles/utils';

export default function DefaultStylePicker( { blockName } ) {
	const {
		preferredStyle,
		onUpdatePreferredStyleVariations,
		styles,
	} = useSelect(
		( select ) => {
			const settings = select( blockEditorStore ).getSettings();
			const preferredStyleVariations =
				settings.__experimentalPreferredStyleVariations;
			return {
				preferredStyle: preferredStyleVariations?.value?.[ blockName ],
				onUpdatePreferredStyleVariations:
					preferredStyleVariations?.onChange ?? null,
				styles: select( blocksStore ).getBlockStyles( blockName ),
			};
		},
		[ blockName ]
	);
	const selectOptions = useMemo(
		() => [
			{ label: __( 'Not set' ), value: '' },
			...styles.map( ( { label, name } ) => ( { label, value: name } ) ),
		],
		[ styles ]
	);
	const defaultStyleName = useMemo( () => getDefaultStyle( styles )?.name, [
		styles,
	] );
	const selectOnChange = useCallback(
		( blockStyle ) => {
			onUpdatePreferredStyleVariations( blockName, blockStyle );
		},
		[ blockName, onUpdatePreferredStyleVariations ]
	);

	// Until the functionality is migrated to global styles,
	// only show the default style picker if a non-default style has already been selected.
	if ( ! preferredStyle || preferredStyle === defaultStyleName ) {
		return null;
	}

	return (
		onUpdatePreferredStyleVariations && (
			<div className="default-style-picker__default-switcher">
				<SelectControl
					options={ selectOptions }
					value={ preferredStyle || '' }
					label={ __( 'Default Style' ) }
					onChange={ selectOnChange }
				/>
			</div>
		)
	);
}
