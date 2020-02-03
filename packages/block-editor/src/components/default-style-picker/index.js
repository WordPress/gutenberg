/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { SelectControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

export default function DefaultStylePicker( { blockName } ) {
	const {
		preferredStyle,
		onUpdatePreferredStyleVariations,
		styles,
	} = useSelect(
		( select ) => {
			const settings = select( 'core/block-editor' ).getSettings();
			const preferredStyleVariations =
				settings.__experimentalPreferredStyleVariations;
			return {
				preferredStyle: get( preferredStyleVariations, [
					'value',
					blockName,
				] ),
				onUpdatePreferredStyleVariations: get(
					preferredStyleVariations,
					[ 'onChange' ],
					null
				),
				styles: select( 'core/blocks' ).getBlockStyles( blockName ),
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
	const selectOnChange = useCallback(
		( blockStyle ) => {
			onUpdatePreferredStyleVariations( blockName, blockStyle );
		},
		[ blockName, onUpdatePreferredStyleVariations ]
	);

	return (
		onUpdatePreferredStyleVariations && (
			<SelectControl
				options={ selectOptions }
				value={ preferredStyle || '' }
				label={ __( 'Default Style' ) }
				onChange={ selectOnChange }
			/>
		)
	);
}
