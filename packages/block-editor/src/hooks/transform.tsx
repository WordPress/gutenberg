import {
	getBlockSupport,
	getBlockType,
	hasBlockSupport,
} from '@wordpress/blocks';
import type { BlockType } from '@wordpress/blocks';
import { useInstanceId } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import { getBlockSelector } from '@wordpress/global-styles-engine';
import { compileCSS, getCSSRules } from '@wordpress/style-engine';
import type { Style } from '@wordpress/style-engine';
import InspectorControls from '../components/inspector-controls';
import {
	TransformPanel as StylesTransformPanel,
	useHasTransformPanel,
} from '../components/global-styles';
import { useResolvedStyle } from '../components/global-styles/inherited-value-context';
import { store as blockEditorStore } from '../store';
import {
	cleanEmptyObject,
	shouldSkipSerialization,
	usePrivateStyleOverride,
} from './utils';
import {
	getStyleForState,
	isDefaultBlockStyleState,
	setStyleForState,
	useBlockStyleState,
} from './block-style-state';
import { buildScopedBlockSelector } from './state-utils';
import type { PanelStyle } from '../components/global-styles/types';
import type {
	BlockListBlockFeatureProps,
	ResetAllFilter,
	StyleInspectorControlProps,
	TransformAttributes,
	TransformHookPanelProps,
} from './types';

export const TRANSFORM_SUPPORT_KEY = 'transform';

const TRANSFORM_FEATURES = [ 'rotate', 'translate' ];

// Used for generating the instance ID.
const TRANSFORM_BLOCK_PROPS_REFERENCE = {};

function TransformInspectorControl( {
	children,
	resetAllFilter,
}: StyleInspectorControlProps ) {
	const attributesResetAllFilter = useCallback(
		( attributes: TransformAttributes ) => {
			const existingStyle = attributes.style;
			const updatedStyle = resetAllFilter( existingStyle );
			return {
				...attributes,
				style: updatedStyle,
			};
		},
		[ resetAllFilter ]
	);

	return (
		<InspectorControls
			group="transform"
			// The filter reads the style attribute.
			resetAllFilter={ attributesResetAllFilter as ResetAllFilter }
		>
			{ children }
		</InspectorControls>
	);
}

export function TransformPanel( {
	clientId,
	name,
	setAttributes,
	settings,
}: TransformHookPanelProps ) {
	const selectedState = useBlockStyleState();
	const isStateSelected = ! isDefaultBlockStyleState( selectedState );
	const isEnabled = useHasTransformPanel( settings );
	const { style, className }: TransformAttributes = useSelect(
		( select ) => {
			// Early return to avoid subscription when disabled
			if ( ! isEnabled ) {
				return {};
			}
			const attributes = ( select( blockEditorStore ).getBlockAttributes(
				clientId
				// The block's attributes hold its styles.
			) || {} ) as TransformAttributes;
			return {
				style: attributes.style,
				className: attributes.className,
			};
		},
		[ clientId, isEnabled ]
	);
	const { value: inheritedValue } = useResolvedStyle(
		name,
		className,
		selectedState
	);

	if ( ! isEnabled ) {
		return null;
	}

	const value = isStateSelected
		? // The state styles have the shape of the block styles.
			( getStyleForState( style, selectedState ) as
				PanelStyle | undefined )
		: style;
	const onChange = ( newStyle: PanelStyle ) => {
		setAttributes( {
			style: isStateSelected
				? setStyleForState( style, selectedState, newStyle )
				: cleanEmptyObject( newStyle ),
		} );
	};

	// The default controls map control names to whether they show.
	const defaultControls = getBlockSupport( name, [
		TRANSFORM_SUPPORT_KEY,
		'__experimentalDefaultControls',
	] ) as Record< string, boolean > | undefined;

	return (
		<StylesTransformPanel
			as={ TransformInspectorControl }
			panelId={ clientId }
			settings={ settings }
			value={ value }
			onChange={ onChange }
			// Unlike Global Styles, the block inspector hides a control
			// unless the block shows it by default.
			defaultControls={ {
				rotate: false,
				translate: false,
				...defaultControls,
			} }
			inheritedValue={ inheritedValue }
		/>
	);
}

/**
 * Determine whether there is block support for a transform feature.
 *
 * @param nameOrType Block name or type object.
 * @param feature    Transform feature to check for.
 *
 * @return Whether there is support.
 */
export function hasTransformSupport(
	nameOrType: string | BlockType,
	feature: string = 'any'
): boolean {
	if ( feature === 'any' ) {
		return TRANSFORM_FEATURES.some( ( transformFeature ) =>
			hasBlockSupport( nameOrType, [
				TRANSFORM_SUPPORT_KEY,
				transformFeature,
			] )
		);
	}

	return hasBlockSupport( nameOrType, [ TRANSFORM_SUPPORT_KEY, feature ] );
}

/**
 * Splits a block's transform styles into the ones output inline on the block
 * wrapper and the ones output under the block's transform feature selector.
 * Mirror of `gutenberg_render_transform_support()` in PHP.
 *
 * @param name      Block name.
 * @param transform The block's transform styles.
 *
 * @return Inline styles, and styles keyed by feature selector.
 */
export function getTransformStyleGroups(
	name: string,
	transform: Record< string, unknown > | undefined
) {
	const inline: Record< string, unknown > = {};
	const bySelector: Record< string, Record< string, unknown > > = {};
	const blockType = getBlockType( name );

	TRANSFORM_FEATURES.forEach( ( feature ) => {
		if (
			! blockType ||
			transform?.[ feature ] === undefined ||
			! hasTransformSupport( name, feature ) ||
			shouldSkipSerialization( name, TRANSFORM_SUPPORT_KEY, feature )
		) {
			return;
		}

		const selector =
			getBlockSelector(
				blockType,
				`${ TRANSFORM_SUPPORT_KEY }.${ feature }`
			) || getBlockSelector( blockType, TRANSFORM_SUPPORT_KEY );
		if ( selector ) {
			bySelector[ selector ] = {
				...bySelector[ selector ],
				[ feature ]: transform[ feature ],
			};
		} else {
			inline[ feature ] = transform[ feature ];
		}
	} );

	return { inline, bySelector };
}

function useBlockProps( {
	clientId,
	name,
	style,
}: BlockListBlockFeatureProps & { style?: PanelStyle } ) {
	const className = useInstanceId(
		TRANSFORM_BLOCK_PROPS_REFERENCE,
		'wp-transform'
	);
	const { inline, bySelector } = useMemo(
		() => getTransformStyleGroups( name, style?.transform ),
		[ name, style?.transform ]
	);
	const css = useMemo(
		() =>
			Object.entries( bySelector )
				.map( ( [ selector, transform ] ) =>
					compileCSS( { transform } as Style, {
						selector: buildScopedBlockSelector(
							`.${ className }`,
							selector,
							'',
							name
						),
					} )
				)
				.join( '' ),
		[ bySelector, className, name ]
	);

	usePrivateStyleOverride( { css, clientId } );

	const inlineStyle = Object.fromEntries(
		getCSSRules( { transform: inline } as Style ).map( ( rule ) => [
			rule.key,
			rule.value,
		] )
	);

	return {
		className: css ? className : undefined,
		style: inlineStyle,
	};
}

export default {
	useBlockProps,
	attributeKeys: [ 'style' ],
	hasSupport( name: string | BlockType ) {
		return hasTransformSupport( name );
	},
};
