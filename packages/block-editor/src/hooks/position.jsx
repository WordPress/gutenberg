import clsx from 'clsx';
import { __, _x, sprintf } from '@wordpress/i18n';
import { getBlockSupport, hasBlockSupport } from '@wordpress/blocks';
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

const { getResponsiveMediaQueries } = unlock( globalStylesEnginePrivateApis );

const POSITION_SUPPORT_KEY = 'position';

const DEFAULT_OPTION = {
	value: '',
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

const POSITION_SIDES = [ 'top', 'right', 'bottom', 'left' ];
const VALID_POSITION_TYPES = [ 'sticky', 'fixed' ];

/**
 * Get calculated position CSS.
 *
 * @param {Object} props          Component props.
 * @param {string} props.selector Selector to use.
 * @param {Object} props.style    Style object.
 * @return {string} The generated CSS rules.
 */
export function getPositionCSS( { selector, style } ) {
	let output = '';

	const { type: positionType } = style?.position || {};

	if ( ! VALID_POSITION_TYPES.includes( positionType ) ) {
		return output;
	}

	output += `${ selector } {`;
	output += `position: ${ positionType };`;

	POSITION_SIDES.forEach( ( side ) => {
		if ( style?.position?.[ side ] !== undefined ) {
			output += `${ side }: ${ style.position[ side ] };`;
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
 * @param {Object} props                  Component props.
 * @param {string} props.selector         Selector to use.
 * @param {Object} props.style            Style object.
 * @param {Object} props.viewportSettings Viewport breakpoint settings.
 * @return {string} The generated CSS rules.
 */
export function getResponsivePositionCSS( {
	selector,
	style,
	viewportSettings,
} ) {
	return Object.entries( getResponsiveMediaQueries( viewportSettings ) )
		.map( ( [ viewport, mediaQuery ] ) => {
			const viewportPosition = getStyleForState( style, {
				viewport,
				pseudo: DEFAULT_BLOCK_STYLE_STATE.pseudo,
			} )?.position;

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
 * @param {Object} style            Style object.
 * @param {Object} viewportSettings Viewport breakpoint settings.
 * @return {string[]} Position types, in default-then-viewport order.
 */
function getPositionTypes( style, viewportSettings ) {
	const types = new Set();

	if ( VALID_POSITION_TYPES.includes( style?.position?.type ) ) {
		types.add( style.position.type );
	}

	Object.keys( getResponsiveMediaQueries( viewportSettings ) ).forEach(
		( viewport ) => {
			const viewportPosition = getStyleForState( style, {
				viewport,
				pseudo: DEFAULT_BLOCK_STYLE_STATE.pseudo,
			} )?.position;
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
 * @param {string|Object} blockType Block name or Block Type object.
 *
 * @return {boolean} Whether there is support.
 */
export function hasStickyPositionSupport( blockType ) {
	const support = getBlockSupport( blockType, POSITION_SUPPORT_KEY );
	return !! ( true === support || support?.sticky );
}

/**
 * Determines if there is fixed position support.
 *
 * @param {string|Object} blockType Block name or Block Type object.
 *
 * @return {boolean} Whether there is support.
 */
export function hasFixedPositionSupport( blockType ) {
	const support = getBlockSupport( blockType, POSITION_SUPPORT_KEY );
	return !! ( true === support || support?.fixed );
}

/**
 * Determines if there is position support.
 *
 * @param {string|Object} blockType Block name or Block Type object.
 *
 * @return {boolean} Whether there is support.
 */
export function hasPositionSupport( blockType ) {
	const support = getBlockSupport( blockType, POSITION_SUPPORT_KEY );
	return !! support;
}

/**
 * Checks if there is a current value in the position block support attributes.
 *
 * @param {Object} props Block props.
 * @return {boolean} Whether or not the block has a position value set.
 */
export function hasPositionValue( props ) {
	return props.attributes.style?.position?.type !== undefined;
}

/**
 * Checks if the block is currently set to a sticky or fixed position.
 * This check is helpful for determining how to position block toolbars or other elements.
 *
 * @param {Object} attributes Block attributes.
 * @return {boolean} Whether or not the block is set to a sticky or fixed position.
 */
export function hasStickyOrFixedPositionValue( attributes ) {
	const positionType = attributes?.style?.position?.type;
	return positionType === 'sticky' || positionType === 'fixed';
}

/**
 * Resets the position block support attributes. This can be used when disabling
 * the position support controls for a block via a `ToolsPanel`.
 *
 * @param {Object} props               Block props.
 * @param {Object} props.attributes    Block's attributes.
 * @param {Object} props.setAttributes Function to set block's attributes.
 */
export function resetPosition( { attributes = {}, setAttributes } ) {
	const { style = {} } = attributes;

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
 * @param {string} name The name of the block.
 *
 * @return {boolean} Whether padding setting is disabled.
 */
export function useIsPositionDisabled( { name: blockName } = {} ) {
	const [ allowFixed, allowSticky ] = useSettings(
		'position.fixed',
		'position.sticky'
	);
	const isDisabled = ! allowFixed && ! allowSticky;

	return ! hasPositionSupport( blockName ) || isDisabled;
}

/*
 * Position controls rendered in an inspector control panel.
 *
 * @param {Object} props
 *
 * @return {Element} Position panel.
 */
export function PositionPanelPure( {
	style = {},
	clientId,
	name: blockName,
	setAttributes,
} ) {
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
		? getStyleForState( style, selectedState )
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
		const availableOptions = [ DEFAULT_OPTION ];
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

	const onChangeType = ( next ) => {
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
				description={ stickyHelpText }
				popupWidth="anchor"
				items={ options }
				value={ selectedOption }
				onValueChange={ ( selectedItem ) => {
					onChangeType( selectedItem.value );
				} }
			/>
		</InspectorControls>
	) : null;
}

export default {
	edit: function Edit( props ) {
		const isPositionDisabled = useIsPositionDisabled( props );
		if ( isPositionDisabled ) {
			return null;
		}
		return <PositionPanelPure { ...props } />;
	},
	useBlockProps,
	attributeKeys: [ 'style' ],
	hasSupport( name ) {
		return hasBlockSupport( name, POSITION_SUPPORT_KEY );
	},
};

// Used for generating the instance ID
const POSITION_BLOCK_PROPS_REFERENCE = {};

function useBlockProps( { name, style } ) {
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
	let css;
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

	useStyleOverride( { css } );

	return { className };
}
