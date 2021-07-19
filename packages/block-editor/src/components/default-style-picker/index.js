/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import { useMemo, useCallback } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { SelectControl } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import {
	getActiveStyle,
	replaceActiveStyle,
} from '../../components/block-styles/utils';

/**
 * External dependencies
 */

import { find } from 'lodash';

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

	function selector( select ) {
		const { getClientId } = select( blockEditorStore );
		return {
			getClientId: getClientId(),
		};
	}

	const { getClientId } = useSelect( selector, [] );

	const clientId = getClientId;

	const selector1 = ( select ) => {
		const { getBlock } = select( blockEditorStore );
		const block = getBlock( clientId );
		return {
			className: block.attributes.className || '',
		};
	};

	const { style, className } = useSelect( selector1, [ clientId ] );

	const renderedStyles = find( style, 'isDefault' )
		? style
		: [
				{
					name: 'default',
					label: _x( 'Default', 'block style' ),
					isDefault: true,
				},
				...style,
		  ];

	const activeStyle = getActiveStyle( renderedStyles, className );

	const styleClassName = replaceActiveStyle( className, activeStyle, style );

	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const selectOnChange = useCallback(
		( blockStyle ) => {
			onUpdatePreferredStyleVariations( blockName, blockStyle );
		},
		updateBlockAttributes( clientId, {
			//	className: 'is-style-large',
			className: styleClassName,
		} ),
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
