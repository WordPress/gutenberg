import {
	getBlockSupport,
	getBlockType,
	hasBlockSupport,
	store as blocksStore,
} from '@wordpress/blocks';
import type { BlockType } from '@wordpress/blocks';
import { useInstanceId } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import {
	getBlockSelector,
	privateApis as globalStylesEnginePrivateApis,
} from '@wordpress/global-styles-engine';
import type { GlobalStylesConfig } from '@wordpress/global-styles-engine';
import { compileCSS, getCSSRules } from '@wordpress/style-engine';
import type { Style } from '@wordpress/style-engine';
import InspectorControls from '../components/inspector-controls';
import {
	TransformPanel as StylesTransformPanel,
	useHasTransformPanel,
} from '../components/global-styles';
import { useResolvedStyle } from '../components/global-styles/inherited-value-context';
import { store as blockEditorStore } from '../store';
import { globalStylesDataKey } from '../store/private-keys';
import { unlock } from '../lock-unlock';
import { getVariationNameFromClass } from './block-style-variation';
import {
	cleanEmptyObject,
	shouldSkipSerialization,
	usePrivateStyleOverride,
} from './utils';
import {
	getStyleForState,
	hasPseudoBlockStyleState,
	hasViewportBlockStyleState,
	isDefaultBlockStyleState,
	setStyleForState,
	useBlockStyleState,
} from './block-style-state';
import { buildScopedBlockSelector } from './state-utils';
import type { PanelStyle } from '../components/global-styles/types';
import type {
	BlockListBlockFeatureProps,
	BlockStyleState,
	ResetAllFilter,
	StyleInspectorControlProps,
	TransformAttributes,
	TransformHookPanelProps,
} from './types';

const { resolveStyle } = unlock( globalStylesEnginePrivateApis );

export const TRANSFORM_SUPPORT_KEY = 'transform';

const TRANSFORM_FEATURES = [ 'rotate', 'translate', 'scale' ];

// Used for generating the instance ID.
const TRANSFORM_BLOCK_PROPS_REFERENCE = {};

type Translate = { x?: unknown; y?: unknown };
type StyleWithTranslate = Record< string, any > | undefined;

const TRANSLATE_AXES = [ 'x', 'y' ] as const;

// Mirror of `WP_Style_Engine::VALID_LENGTH_PERCENTAGE_PATTERN` in PHP.
const VALID_LENGTH_PERCENTAGE_PATTERN =
	/^(?:[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:%|px|cm|mm|q|in|pt|pc|r?em|r?ex|r?ch|r?cap|r?ic|r?lh|[sld]?v(?:w|h|i|b|min|max)|cq(?:w|h|i|b|min|max))|0)$/i;

function isValidTranslateAxis( value: unknown ): value is string {
	return (
		typeof value === 'string' &&
		VALID_LENGTH_PERCENTAGE_PATTERN.test( value )
	);
}

function isSet( value: unknown ) {
	return value !== undefined && value !== null;
}

function hasOneTranslateAxis( translate: unknown ): translate is Translate {
	return (
		!! translate &&
		typeof translate === 'object' &&
		isSet( ( translate as Translate ).x ) !==
			isSet( ( translate as Translate ).y )
	);
}

/**
 * Fills the missing axis of a `translate` value from fallback values.
 * Mirror of `gutenberg_fill_translate_axes()` in PHP.
 *
 * @param translate The `translate` value, with `x` and `y` axes.
 * @param fallbacks The `translate` values to fill from, in order.
 *
 * @return The value with its missing axis filled, or the value as it was if
 * it is not a value with one axis.
 */
export function fillTranslateAxes(
	translate: unknown,
	...fallbacks: unknown[]
) {
	if ( ! hasOneTranslateAxis( translate ) ) {
		return translate;
	}

	const filled: Translate = { ...translate };
	TRANSLATE_AXES.forEach( ( axis ) => {
		if ( isSet( filled[ axis ] ) ) {
			return;
		}
		const value = fallbacks
			.map(
				( fallback ) => ( fallback as Translate | undefined )?.[ axis ]
			)
			.find( isValidTranslateAxis );
		if ( value !== undefined ) {
			filled[ axis ] = value;
		}
	} );

	return filled;
}

function isStateKey( key: string ) {
	return key.startsWith( '@' ) || key.startsWith( ':' );
}

function withFilledTranslate(
	stateStyle: StyleWithTranslate,
	fallbacks: unknown[]
) {
	const translate = stateStyle?.transform?.translate;
	if ( ! hasOneTranslateAxis( translate ) ) {
		return stateStyle;
	}
	return {
		...stateStyle,
		transform: {
			...stateStyle?.transform,
			translate: fillTranslateAxes( translate, ...fallbacks ),
		},
	};
}

/**
 * Whether a block's styles set one `translate` axis in any state.
 *
 * @param style The block's `style` attribute.
 *
 * @return Whether an axis needs filling.
 */
export function hasMissingTranslateAxis( style: StyleWithTranslate ): boolean {
	if ( ! style || typeof style !== 'object' ) {
		return false;
	}
	return (
		hasOneTranslateAxis( style.transform?.translate ) ||
		Object.keys( style ).some(
			( key ) =>
				isStateKey( key ) && hasMissingTranslateAxis( style[ key ] )
		)
	);
}

/**
 * Fills the missing `translate` axis of a block's styles, in every state.
 * Mirror of `gutenberg_get_block_style_with_filled_translate()` in PHP.
 *
 * @param style           The block's `style` attribute.
 * @param globalTranslate The Global Styles `translate` value for the block.
 *
 * @return The styles with the missing axes filled.
 */
export function getStyleWithFilledTranslate(
	style: StyleWithTranslate,
	globalTranslate: unknown
): StyleWithTranslate {
	if ( ! hasMissingTranslateAxis( style ) ) {
		return style;
	}

	const filled = withFilledTranslate( style, [ globalTranslate ] ) as Record<
		string,
		any
	>;
	const defaultTranslate = filled.transform?.translate;
	const states = Object.keys( filled ).filter(
		( key ) => isStateKey( key ) && filled[ key ]
	);
	states.forEach( ( state ) => {
		filled[ state ] = withFilledTranslate( filled[ state ], [
			defaultTranslate,
			globalTranslate,
		] );
	} );
	states
		.filter( ( viewport ) => viewport.startsWith( '@' ) )
		.forEach( ( viewport ) => {
			Object.keys( filled[ viewport ] )
				.filter( ( key ) => key.startsWith( ':' ) )
				.forEach( ( pseudoState ) => {
					filled[ viewport ] = {
						...filled[ viewport ],
						[ pseudoState ]: withFilledTranslate(
							filled[ viewport ][ pseudoState ],
							[
								filled[ pseudoState ]?.transform?.translate,
								filled[ viewport ].transform?.translate,
								defaultTranslate,
								globalTranslate,
							]
						),
					};
				} );
		} );

	return filled;
}

/**
 * Returns a block's styles with the missing `translate` axis filled, in every
 * state, from the block and its resolved Global Styles value. The values are
 * filled for output only, so later Global Styles changes still apply.
 *
 * @param clientId Block client ID.
 * @param name     Block name.
 * @param style    The block's `style` attribute.
 *
 * @return The styles with the missing axes filled.
 */
export function useStyleWithFilledTranslate< T extends StyleWithTranslate >(
	clientId: string,
	name: string,
	style: T
): T {
	const needsFill =
		hasTransformSupport( name, 'translate' ) &&
		hasMissingTranslateAxis( style );
	const { globalStyles, variationName } = useSelect(
		( select ) => {
			if ( ! needsFill ) {
				return {};
			}
			const { className } = ( select(
				blockEditorStore
			).getBlockAttributes( clientId ) || {} ) as { className?: string };
			return {
				globalStyles: (
					select( blockEditorStore ).getSettings() as Record<
						symbol,
						unknown
					>
				 )[ globalStylesDataKey ],
				variationName: className
					? getVariationNameFromClass(
							className,
							select( blocksStore ).getBlockStyles( name )
						)
					: null,
			};
		},
		[ clientId, name, needsFill ]
	);

	return useMemo( () => {
		if ( ! needsFill ) {
			return style;
		}
		const globalTranslate = globalStyles
			? resolveStyle( { styles: globalStyles } as GlobalStylesConfig, {
					blockName: name,
					variationName,
				} ).value?.transform?.translate
			: undefined;
		return getStyleWithFilledTranslate( style, globalTranslate ) as T;
	}, [ needsFill, style, globalStyles, name, variationName ] );
}

/**
 * Returns a state style with its scale removed when the block does not
 * support `transform.scale`. Mirror of
 * `gutenberg_get_state_style_with_supported_scale()` in PHP.
 *
 * @param stateStyle State style object.
 * @param name       Block name, or `null` for an element, which never scales.
 *
 * @return The state style object.
 */
export function getStateStyleWithSupportedScale< T extends StyleWithTranslate >(
	stateStyle: T,
	name: string | null
): T {
	if (
		! stateStyle?.transform ||
		! Object.hasOwn( stateStyle.transform, 'scale' ) ||
		( name && hasTransformSupport( name, 'scale' ) )
	) {
		return stateStyle;
	}
	const { scale, ...transform } = stateStyle.transform;
	return { ...stateStyle, transform } as T;
}

/**
 * Returns element state styles with every scale removed, as elements never
 * scale. Mirror of the element states in `gutenberg_render_block_states_support()`.
 *
 * @param elements Element styles keyed by element name.
 *
 * @return The element styles without a scale.
 */
export function getElementStylesWithoutScale<
	T extends Record< string, any > | undefined,
>( elements: T ): T {
	if ( ! elements ) {
		return elements;
	}
	return Object.fromEntries(
		Object.entries( elements ).map( ( [ element, elementStyle ] ) => {
			const withoutScale = getStateStyleWithSupportedScale(
				elementStyle,
				null
			) as Record< string, any > | undefined;
			if ( ! withoutScale || typeof withoutScale !== 'object' ) {
				return [ element, withoutScale ];
			}
			return [
				element,
				Object.fromEntries(
					Object.entries( withoutScale ).map( ( [ key, value ] ) => [
						key,
						key.startsWith( ':' )
							? getStateStyleWithSupportedScale( value, null )
							: value,
					] )
				),
			];
		} )
	) as T;
}

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

/**
 * Returns the inherited value the Transform panel shows for a block state,
 * so a missing offset axis shows the value it renders with: the block value
 * the state layers over, else Global Styles. Mirror of the order in
 * `getStyleWithFilledTranslate()`.
 *
 * @param resolvedValue      Global Styles value resolved for the state.
 * @param globalTranslate    Global Styles offset for the default state.
 * @param filledStyle        The block styles with missing axes filled.
 * @param selectedState      Selected block style state.
 * @param stateSetsTranslate Whether the state sets an offset.
 *
 * @return Inherited value for the panel.
 */
export function getStateInheritedValue(
	resolvedValue: PanelStyle,
	globalTranslate: unknown,
	filledStyle: StyleWithTranslate,
	selectedState: BlockStyleState,
	stateSetsTranslate: boolean
): PanelStyle {
	const { viewport, pseudo } = selectedState;
	const blockLayers =
		hasViewportBlockStyleState( selectedState ) &&
		hasPseudoBlockStyleState( selectedState )
			? [
					filledStyle?.[ pseudo as string ]?.transform?.translate,
					filledStyle?.[ viewport as string ]?.transform?.translate,
				]
			: [];
	blockLayers.push( filledStyle?.transform?.translate );
	const blockTranslate = blockLayers.find( isSet );
	// A state with its own offset fills from the default Global Styles value.
	const translate =
		blockTranslate ??
		( stateSetsTranslate
			? globalTranslate
			: resolvedValue?.transform?.translate );

	return {
		...resolvedValue,
		transform: { ...resolvedValue?.transform, translate },
	} as PanelStyle;
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
	const { value: resolvedValue } = useResolvedStyle(
		name,
		className,
		selectedState
	);
	const { value: defaultResolvedValue } = useResolvedStyle( name, className );
	const filledStyle = useStyleWithFilledTranslate( clientId, name, style );

	if ( ! isEnabled ) {
		return null;
	}

	const value = isStateSelected
		? // The state styles have the shape of the block styles.
			( getStyleForState( style, selectedState ) as
				PanelStyle | undefined )
		: style;
	const inheritedValue = isStateSelected
		? getStateInheritedValue(
				resolvedValue as PanelStyle,
				defaultResolvedValue?.transform?.translate,
				filledStyle,
				selectedState,
				value?.transform?.translate !== undefined
			)
		: resolvedValue;
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
				scale: false,
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
	const filledStyle = useStyleWithFilledTranslate( clientId, name, style );
	const { inline, bySelector } = useMemo(
		() => getTransformStyleGroups( name, filledStyle?.transform ),
		[ name, filledStyle?.transform ]
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
