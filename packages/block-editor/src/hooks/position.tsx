import clsx from 'clsx';
import { __, _x, sprintf } from '@wordpress/i18n';
import { getBlockSupport, hasBlockSupport } from '@wordpress/blocks';
import type { BlockType } from '@wordpress/blocks';
import { useInstanceId } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { privateApis as globalStylesEnginePrivateApis } from '@wordpress/global-styles-engine';
import { SelectControl } from '@wordpress/ui';
import { useSettings } from '../components/use-settings';
import InspectorControls from '../components/inspector-controls';
import useBlockDisplayInformation from '../components/use-block-display-information';
import { cleanEmptyObject, useStyleOverride } from './utils';
import {
	DEFAULT_BLOCK_STYLE_STATE,
	getStyleForState,
	setStyleForState,
} from './block-style-state';
import { store as blockEditorStore } from '../store';
import { unlock } from '../lock-unlock';
import type {
	BlockListBlockFeatureProps,
	BlockSupportEditProps,
	PositionAttributes,
	PositionBlockStyle,
	PositionCSSOptions,
	PositionPanelProps,
	PositionStyle,
	PositionValueProps,
	ResetPositionProps,
	ResponsivePositionCSSOptions,
} from './types';

const { getResponsiveMediaQueries } = unlock( globalStylesEnginePrivateApis );

const POSITION_SUPPORT_KEY = 'position';

// The default position is stored as an empty string, but the select treats
// an empty value as no selection and shows its placeholder.
const DEFAULT_OPTION = {
	value: '__default',
	label: __( 'Default' ),
};

const STICKY_OPTION = {
	value: 'sticky',
	label: _x( 'Sticky', 'Name for the value of the CSS position property' ),
	description: __(
		'The block will stick to the top of the window instead of scrolling.'
	),
};

const FIXED_OPTION = {
	value: 'fixed',
	label: _x( 'Fixed', 'Name for the value of the CSS position property' ),
	description: __( 'The block will not move when the page is scrolled.' ),
};

const POSITION_SIDES = [ 'top', 'right', 'bottom', 'left' ] as const;
const VALID_POSITION_TYPES: Array< string | undefined > = [ 'sticky', 'fixed' ];

/**
 * Get calculated position CSS.
 *
 * @param props          Component props.
 * @param props.selector Selector to use.
 * @param props.style    Style object.
 * @return The generated CSS rules.
 */
export function getPositionCSS( {
	selector,
	style,
}: PositionCSSOptions ): string {
	let output = '';

	const { type: positionType }: PositionStyle = style?.position || {};

	if ( ! VALID_POSITION_TYPES.includes( positionType ) ) {
		return output;
	}

	output += `${ selector } {`;
	output += `position: ${ positionType };`;

	POSITION_SIDES.forEach( ( side ) => {
		if ( style?.position?.[ side ] !== undefined ) {
			// The check above found the side.
			output += `${ side }: ${ style!.position![ side ] };`;
		}
	} );

	if ( positionType === 'sticky' || positionType === 'fixed' ) {
		// TODO: Replace hard-coded z-index value with a z-index preset approach in theme.json.
		output += `z-index: 10`;
	}
	output += `}`;

	return output;
}

/**
 * Get calculated position CSS for responsive viewport states.
 *
 * Viewport states inherit any values they do not set from the default
 * viewport's position configuration. Generated rules are wrapped in the
 * matching breakpoint media query.
 *
 * @param props                  Component props.
 * @param props.selector         Selector to use.
 * @param props.style            Style object.
 * @param props.viewportSettings Viewport breakpoint settings.
 * @return The generated CSS rules.
 */
export function getResponsivePositionCSS( {
	selector,
	style,
	viewportSettings,
}: ResponsivePositionCSSOptions ): string {
	return Object.entries( getResponsiveMediaQueries( viewportSettings ) )
		.map( ( [ viewport, mediaQuery ] ) => {
			const viewportPosition = (
				getStyleForState( style, {
					viewport,
					pseudo: DEFAULT_BLOCK_STYLE_STATE.pseudo,
				} ) as PositionBlockStyle | undefined
			 )?.position;

			if ( ! viewportPosition ) {
				return '';
			}

			const css = getPositionCSS( {
				selector,
				style: {
					position: { ...style?.position, ...viewportPosition },
				},
			} );

			if ( css ) {
				return `${ mediaQuery }{${ css }}`;
			}

			// The viewport state clears the position type inherited from the
			// default state. The default state's `position` declaration isn't
			// itself wrapped in a media query, so without an explicit reset it
			// would still apply at this breakpoint.
			if ( VALID_POSITION_TYPES.includes( style?.position?.type ) ) {
				return `${ mediaQuery }{${ selector }{position: static;}}`;
			}

			return '';
		} )
		.filter( Boolean )
		.join( '' );
}

/**
 * Returns the position types used across the default and responsive viewport
 * states of a style object.
 *
 * @param style            Style object.
 * @param viewportSettings Viewport breakpoint settings.
 * @return Position types, in default-then-viewport order.
 */
function getPositionTypes(
	style: PositionBlockStyle | undefined,
	viewportSettings: unknown
): Array< string | undefined > {
	const types = new Set< string | undefined >();

	if ( VALID_POSITION_TYPES.includes( style?.position?.type ) ) {
		// The check above found the position type.
		types.add( style!.position!.type );
	}

	Object.keys( getResponsiveMediaQueries( viewportSettings ) ).forEach(
		( viewport ) => {
			const viewportPosition = (
				getStyleForState( style, {
					viewport,
					pseudo: DEFAULT_BLOCK_STYLE_STATE.pseudo,
				} ) as PositionBlockStyle | undefined
			 )?.position;
			const type = viewportPosition
				? { ...style?.position, ...viewportPosition }.type
				: undefined;

			if ( VALID_POSITION_TYPES.includes( type ) ) {
				types.add( type );
			}
		}
	);

	return [ ...types ];
}

/**
 * Determines if there is sticky position support.
 *
 * @param blockType Block name or Block Type object.
 *
 * @return Whether there is support.
 */
export function hasStickyPositionSupport(
	blockType: string | BlockType
): boolean {
	const support = getBlockSupport( blockType, POSITION_SUPPORT_KEY );
	return !! (
		true === support ||
		( support as { sticky?: boolean } | undefined )?.sticky
	);
}

/**
 * Determines if there is fixed position support.
 *
 * @param blockType Block name or Block Type object.
 *
 * @return Whether there is support.
 */
export function hasFixedPositionSupport(
	blockType: string | BlockType
): boolean {
	const support = getBlockSupport( blockType, POSITION_SUPPORT_KEY );
	return !! (
		true === support ||
		( support as { fixed?: boolean } | undefined )?.fixed
	);
}

/**
 * Determines if there is position support.
 *
 * @param blockType Block name or Block Type object.
 *
 * @return Whether there is support.
 */
export function hasPositionSupport( blockType: string | BlockType ): boolean {
	const support = getBlockSupport( blockType, POSITION_SUPPORT_KEY );
	return !! support;
}

/**
 * Checks if there is a current value in the position block support attributes.
 *
 * @param props            Block props.
 * @param props.attributes Block attributes.
 * @return Whether or not the block has a position value set.
 */
export function hasPositionValue( props: PositionValueProps ): boolean {
	return props.attributes.style?.position?.type !== undefined;
}

/**
 * Checks if the block is currently set to a sticky or fixed position.
 * This check is helpful for determining how to position block toolbars or other elements.
 *
 * @param attributes Block attributes.
 * @return Whether or not the block is set to a sticky or fixed position.
 */
export function hasStickyOrFixedPositionValue(
	attributes?: PositionAttributes
): boolean {
	const positionType = attributes?.style?.position?.type;
	return positionType === 'sticky' || positionType === 'fixed';
}

/**
 * Resets the position block support attributes. This can be used when disabling
 * the position support controls for a block via a `ToolsPanel`.
 *
 * @param props               Block props.
 * @param props.attributes    Block's attributes.
 * @param props.setAttributes Function to set block's attributes.
 */
export function resetPosition( {
	attributes = {},
	setAttributes,
}: ResetPositionProps ) {
	const { style = {} }: { style?: PositionBlockStyle } = attributes;

	setAttributes( {
		style: cleanEmptyObject( {
			...style,
			position: {
				...style?.position,
				type: undefined,
				top: undefined,
				right: undefined,
				bottom: undefined,
				left: undefined,
			},
		} ),
	} );
}

/**
 * Custom hook that checks if position settings have been disabled.
 *
 * @param $0      Block props.
 * @param $0.name The name of the block.
 *
 * @return Whether padding setting is disabled.
 */
export function useIsPositionDisabled( {
	name: blockName,
}: { name?: string } = {} ): boolean {
	const [ allowFixed, allowSticky ] = useSettings(
		'position.fixed',
		'position.sticky'
	);
	const isDisabled = ! allowFixed && ! allowSticky;

	// Callers pass the block name.
	return ! hasPositionSupport( blockName as string ) || isDisabled;
}

/*
 * Position controls rendered in an inspector control panel.
 *
 * @param props
 *
 * @return Position panel.
 */
export function PositionPanelPure( {
	style = {},
	clientId,
	name: blockName,
	setAttributes,
}: PositionPanelProps ) {
	const allowFixed = hasFixedPositionSupport( blockName );
	const allowSticky = hasStickyPositionSupport( blockName );

	const { firstParentClientId, selectedState } = useSelect(
		( select ) => {
			const { getBlockParents } = select( blockEditorStore );
			const { getSelectedBlockStyleState } = unlock(
				select( blockEditorStore )
			);
			const parents = getBlockParents( clientId );
			return {
				firstParentClientId: parents[ parents.length - 1 ],
				selectedState: getSelectedBlockStyleState( clientId ),
			};
		},
		[ clientId ]
	);

	// Position styles only support viewport states; pseudo states don't apply.
	const isViewportState =
		selectedState?.viewport &&
		selectedState.viewport !== DEFAULT_BLOCK_STYLE_STATE.viewport &&
		( ! selectedState.pseudo ||
			selectedState.pseudo === DEFAULT_BLOCK_STYLE_STATE.pseudo );
	const stateStyle = isViewportState
		? ( getStyleForState( style, selectedState ) as
				PositionBlockStyle | undefined )
		: undefined;
	// Viewport states inherit the default viewport's position type.
	const value = isViewportState
		? ( stateStyle?.position?.type ?? style?.position?.type )
		: style?.position?.type;

	const blockInformation = useBlockDisplayInformation( firstParentClientId );
	const stickyHelpText =
		allowSticky && value === STICKY_OPTION.value && blockInformation
			? sprintf(
					/* translators: %s: the name of the parent block. */
					__(
						'The block will stick to the scrollable area of the parent %s block.'
					),
					blockInformation.title
				)
			: null;

	const options = useMemo( () => {
		const availableOptions: Array< {
			value: string;
			label: string;
			description?: string;
		} > = [ DEFAULT_OPTION ];
		// Display options if they are allowed, or if a block already has a valid value set.
		// This allows for a block to be switched off from a position type that is not allowed.
		if ( allowSticky || value === STICKY_OPTION.value ) {
			availableOptions.push( STICKY_OPTION );
		}
		if ( allowFixed || value === FIXED_OPTION.value ) {
			availableOptions.push( FIXED_OPTION );
		}
		return availableOptions;
	}, [ allowFixed, allowSticky, value ] );

	const onChangeType = ( next: string | null ) => {
		// For now, use a hard-coded `0px` value for the position.
		// `0px` is preferred over `0` as it can be used in `calc()` functions.
		// In the future, it could be useful to allow for an offset value.
		const placementValue = '0px';

		if ( isViewportState ) {
			const newStateStyle = {
				...stateStyle,
				position: {
					...stateStyle?.position,
					type: next,
					top:
						next === 'sticky' || next === 'fixed'
							? placementValue
							: undefined,
				},
			};

			setAttributes( {
				style: setStyleForState( style, selectedState, newStateStyle ),
			} );
			return;
		}

		const newStyle = {
			...style,
			position: {
				...style?.position,
				type: next,
				top:
					next === 'sticky' || next === 'fixed'
						? placementValue
						: undefined,
			},
		};

		setAttributes( {
			style: cleanEmptyObject( newStyle ),
		} );
	};

	const selectedOption = value
		? options.find( ( option ) => option.value === value ) || DEFAULT_OPTION
		: DEFAULT_OPTION;

	// Only display position controls if there is at least one option to choose from.
	return options.length > 1 ? (
		<InspectorControls group="position">
			<SelectControl
				label={ __( 'Position' ) }
				hideLabelFromVision
				// A `null` description renders nothing.
				description={ stickyHelpText as string | undefined }
				popupWidth="anchor"
				items={ options }
				value={ selectedOption }
				onValueChange={ ( selectedItem ) => {
					// The select has no empty choice.
					onChangeType(
						selectedItem!.value === DEFAULT_OPTION.value
							? ''
							: selectedItem!.value
					);
				} }
			/>
		</InspectorControls>
	) : null;
}

export default {
	edit: function Edit( props: BlockSupportEditProps ) {
		const isPositionDisabled = useIsPositionDisabled( props );
		if ( isPositionDisabled ) {
			return null;
		}
		// The block support passes the style attribute among the props.
		return <PositionPanelPure { ...( props as PositionPanelProps ) } />;
	},
	useBlockProps,
	attributeKeys: [ 'style' ],
	hasSupport( name: string ) {
		return hasBlockSupport( name, POSITION_SUPPORT_KEY );
	},
};

// Used for generating the instance ID
const POSITION_BLOCK_PROPS_REFERENCE = {};

function useBlockProps( {
	name,
	style,
}: BlockListBlockFeatureProps & { style?: PositionBlockStyle } ) {
	const hasPositionBlockSupport = hasBlockSupport(
		name,
		POSITION_SUPPORT_KEY
	);
	const isPositionDisabled = useIsPositionDisabled( { name } );
	const allowPositionStyles = hasPositionBlockSupport && ! isPositionDisabled;
	const [ viewportSettings ] = useSettings( 'viewport' );

	const id = useInstanceId( POSITION_BLOCK_PROPS_REFERENCE );

	// Higher specificity to override defaults in editor UI.
	const positionSelector = `.wp-container-${ id }.wp-container-${ id }`;

	// Get CSS string for the current position values, including any
	// responsive viewport state values.
	let css: string | undefined;
	if ( allowPositionStyles ) {
		css = [
			getPositionCSS( {
				selector: positionSelector,
				style,
			} ) || '',
			getResponsivePositionCSS( {
				selector: positionSelector,
				style,
				viewportSettings,
			} ),
		].join( '' );
	}

	// Attach a `wp-container-` id-based class name, plus an `is-position-*`
	// class for each position type used across the default and viewport
	// states, matching the frontend output.
	const className = clsx(
		allowPositionStyles && !! css ? `wp-container-${ id }` : undefined,
		allowPositionStyles && !! css
			? getPositionTypes( style, viewportSettings ).map(
					( type ) => `is-position-${ type }`
				)
			: undefined
	);

	// An unset CSS string removes the override.
	useStyleOverride( { css: css as string } );

	return { className };
}
