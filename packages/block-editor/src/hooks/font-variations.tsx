import { useSelect } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import type { ReactNode } from 'react';
import InspectorControls from '../components/inspector-controls';
import StylesFontVariationsPanel from '../components/global-styles/font-variations-panel';
import { useResolvedStyle } from '../components/global-styles/inherited-value-context';
import { cleanEmptyObject } from './utils';
import {
	isDefaultBlockStyleState,
	useBlockStyleState,
} from './block-style-state';
import { store as blockEditorStore } from '../store';

export const FONT_VARIATION_SETTINGS_SUPPORT_KEY =
	'typography.fontVariationSettings';

type Style = Record< string, any >;

interface FontVariationsPanelProps {
	clientId: string;
	name: string;
	setAttributes: ( attributes: Record< string, unknown > ) => void;
	settings: Record< string, any >;
}

interface InspectorControlProps {
	resetAllFilter: ( style: Style ) => Style;
	children: ReactNode;
}

function FontVariationsInspectorControl( {
	children,
	resetAllFilter,
}: InspectorControlProps ) {
	const attributesResetAllFilter = useCallback(
		( attributes: Record< string, any > ) => ( {
			...attributes,
			style: cleanEmptyObject( resetAllFilter( attributes.style ) ),
		} ),
		[ resetAllFilter ]
	);

	return (
		<InspectorControls
			group="fontVariations"
			resetAllFilter={ attributesResetAllFilter }
		>
			{ children }
		</InspectorControls>
	);
}

/**
 * Block inspector controls for `typography.fontVariationSettings`. The font
 * family comes from the block, or from Global Styles when the block has none.
 *
 * @param props               The component props.
 * @param props.clientId      Block client ID.
 * @param props.name          Block name.
 * @param props.setAttributes Sets block attributes.
 * @param props.settings      Block settings.
 */
export function FontVariationsPanel( {
	clientId,
	name,
	setAttributes,
	settings,
}: FontVariationsPanelProps ) {
	const selectedState = useBlockStyleState();
	const { style, fontFamily, className } = useSelect(
		( select ) => {
			const attributes =
				// @ts-expect-error The store is not typed yet.
				select( blockEditorStore ).getBlockAttributes( clientId ) || {};
			return {
				style: attributes.style,
				fontFamily: attributes.fontFamily,
				className: attributes.className,
			};
		},
		[ clientId ]
	);
	const { value: inheritedValue } = useResolvedStyle(
		name,
		className,
		selectedState
	);

	const value = useMemo(
		() => ( {
			...style,
			typography: {
				...style?.typography,
				fontFamily: fontFamily
					? `var:preset|font-family|${ fontFamily }`
					: style?.typography?.fontFamily,
			},
		} ),
		[ style, fontFamily ]
	);

	// Axis values are not part of block style states yet.
	if ( ! isDefaultBlockStyleState( selectedState ) ) {
		return null;
	}

	const onChange = ( newStyle: Style ) =>
		setAttributes( {
			style: cleanEmptyObject( {
				...style,
				typography: {
					...style?.typography,
					fontVariationSettings:
						newStyle?.typography?.fontVariationSettings,
				},
			} ),
		} );

	return (
		<StylesFontVariationsPanel
			as={ FontVariationsInspectorControl }
			panelId={ clientId }
			settings={ settings }
			value={ value }
			onChange={ onChange }
			inheritedValue={ inheritedValue }
		/>
	);
}
