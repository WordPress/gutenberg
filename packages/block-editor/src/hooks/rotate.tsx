import { getBlockType, hasBlockSupport } from '@wordpress/blocks';
import type { BlockType } from '@wordpress/blocks';
import {
	AnglePickerControl,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { privateApis as globalStylesEnginePrivateApis } from '@wordpress/global-styles-engine';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import InspectorControls from '../components/inspector-controls';
import { useSettings } from '../components/use-settings';
import { store as blockEditorStore } from '../store';
import { unlock } from '../lock-unlock';
import { isPlainObject } from '../utils/object';
import {
	fromPickerAngle,
	normalizeAngle,
	toPickerAngle,
} from '../utils/rotation';
import { cleanEmptyObject, usePrivateStyleOverride } from './utils';
import {
	BlockStyleStateProvider,
	DEFAULT_BLOCK_STYLE_STATE,
	getStyleForState,
	hasPseudoBlockStyleState,
	hasViewportBlockStyleState,
	setStyleForState,
} from './block-style-state';

const { getResponsiveMediaQueries } = unlock( globalStylesEnginePrivateApis );

export const ROTATE_SUPPORT_KEY = 'rotate';

type BlockStyle = Record< string, any >;

interface BlockStyleState {
	viewport?: string;
	pseudo?: string;
}

interface BlockAttributes {
	style?: BlockStyle;
	[ key: string ]: unknown;
}

interface RotateEditProps {
	clientId: string;
	name: string;
	setAttributes: ( attributes: BlockAttributes ) => void;
	style?: BlockStyle;
}

// Used for generating the instance ID.
const ROTATE_BLOCK_PROPS_REFERENCE = {};

// A number in decimal notation, as PHP's `is_numeric()` accepts it. Hex,
// binary and octal strings such as `0x10`, which `Number()` would read, are
// not rotations.
const DECIMAL_NUMBER_PATTERN = /^\s*[+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?\s*$/i;

/**
 * Returns whether a block supports rotation. Blocks do unless they opt out
 * with `supports.rotate: false`, or define a `style` attribute of their own
 * that is not an object, which rotation could not be stored in.
 *
 * @param nameOrType Block name or block type object.
 *
 * @return Whether the block supports rotation.
 */
export function hasRotateSupport( nameOrType: string | BlockType ): boolean {
	const blockType =
		typeof nameOrType === 'string'
			? getBlockType( nameOrType )
			: nameOrType;
	const styleType = blockType?.attributes?.style?.type;
	return (
		( styleType === undefined || styleType === 'object' ) &&
		hasBlockSupport( nameOrType, ROTATE_SUPPORT_KEY, true )
	);
}

/**
 * Returns a block style attribute when it is an object, which is the only
 * kind of style attribute rotation is read from or written to.
 *
 * @param style Block style attribute.
 *
 * @return The style attribute, or undefined when it is not an object.
 */
function getStyleObject( style: unknown ): BlockStyle | undefined {
	return isPlainObject( style ) ? style : undefined;
}

/**
 * Returns whether rotation can be edited for a block: the block rotation
 * experiment is on and the block supports rotation.
 *
 * Rotation that is already stored is shown whether or not this is true.
 *
 * @param nameOrType Block name or block type object.
 *
 * @return Whether rotation can be edited.
 */
export function isRotateEnabled( nameOrType: string | BlockType ): boolean {
	const { __experimentalEnableBlockRotation: isExperimentEnabled } =
		window as Window & { __experimentalEnableBlockRotation?: boolean };
	return !! isExperimentEnabled && hasRotateSupport( nameOrType );
}

/**
 * Reads a stored rotation, which is a number of degrees. Anything that is not
 * a finite number, or a string holding one in decimal notation, is ignored.
 * Matches `gutenberg_get_rotate_value()` in PHP.
 *
 * @param value Stored rotation.
 *
 * @return The rotation in (-180, 180], rounded to two decimals, or undefined.
 */
export function getRotateValue( value: unknown ): number | undefined {
	const angle =
		typeof value === 'string' && DECIMAL_NUMBER_PATTERN.test( value )
			? Number( value )
			: value;
	if ( typeof angle !== 'number' || ! Number.isFinite( angle ) ) {
		return undefined;
	}
	// Round halves away from zero, after removing floating point noise, the
	// way PHP's `round()` does: 1.005 is 1.01 and -12.345 is -12.35.
	const rounded =
		( Math.sign( angle ) *
			Math.round(
				Number( ( Math.abs( angle ) * 100 ).toPrecision( 15 ) )
			) ) /
		100;
	return normalizeAngle( rounded );
}

/**
 * Returns the state that holds rotation for a selected style state. Rotation
 * is stored per viewport only, so a pseudo state such as `:hover` is ignored.
 *
 * @param selectedState Selected block style state.
 *
 * @return The style state rotation is stored in.
 */
function getRotateState( selectedState: BlockStyleState ): BlockStyleState {
	return {
		viewport: hasViewportBlockStyleState( selectedState )
			? selectedState.viewport
			: DEFAULT_BLOCK_STYLE_STATE.viewport,
		pseudo: DEFAULT_BLOCK_STYLE_STATE.pseudo,
	};
}

/**
 * Returns the styles of a block for the state rotation is stored in.
 *
 * @param style         Block style attribute.
 * @param selectedState Selected block style state.
 *
 * @return The styles of that state, if any.
 */
function getRotateStateStyle(
	style: BlockStyle | undefined,
	selectedState: BlockStyleState
): BlockStyle | undefined {
	return getStyleObject(
		getStyleForState(
			getStyleObject( style ) ?? {},
			getRotateState( selectedState )
		)
	);
}

/**
 * Returns the rotation a block has in a style state: the viewport's own
 * rotation when it sets one, otherwise the default rotation.
 *
 * @param style         Block style attribute.
 * @param selectedState Selected block style state.
 *
 * @return The rotation in degrees, in (-180, 180]. 0 when not rotated.
 */
export function getRotateForState(
	style: BlockStyle | undefined,
	selectedState: BlockStyleState
): number {
	const defaultRotate =
		getRotateValue( getStyleObject( style )?.rotate ) ?? 0;
	if ( ! hasViewportBlockStyleState( selectedState ) ) {
		return defaultRotate;
	}
	return (
		getRotateValue( getRotateStateStyle( style, selectedState )?.rotate ) ??
		defaultRotate
	);
}

/**
 * Returns a block style attribute with the rotation of a style state set.
 *
 * In the default state, no rotation is stored as no value. In a viewport
 * state, 0 is kept, because it undoes the default rotation on that viewport.
 * An undefined angle removes the state's rotation.
 *
 * @param style         Block style attribute.
 * @param angle         Rotation in degrees.
 * @param selectedState Selected block style state.
 *
 * @return The updated block style attribute.
 *
 * @example
 * ```js
 * setAttributes( {
 * 	style: getUpdatedRotateStyle( attributes.style, 30, { viewport: '@mobile' } ),
 * } );
 * ```
 */
export function getUpdatedRotateStyle(
	style: BlockStyle | undefined,
	angle: number | undefined,
	selectedState: BlockStyleState
): BlockStyle | undefined {
	const baseStyle = getStyleObject( style );
	const rotateState = getRotateState( selectedState );
	const isViewportState = hasViewportBlockStyleState( rotateState );
	let rotate = getRotateValue( angle );
	if ( rotate === 0 && ! isViewportState ) {
		rotate = undefined;
	}

	if ( ! isViewportState ) {
		return cleanEmptyObject( { ...baseStyle, rotate } );
	}

	return setStyleForState( baseStyle ?? {}, rotateState, {
		...getRotateStateStyle( baseStyle, rotateState ),
		rotate,
	} );
}

/**
 * Returns whether a block style attribute holds any rotation.
 *
 * @param style Block style attribute.
 *
 * @return Whether there is a rotation in the default or a viewport state.
 */
function hasRotateValue( style: BlockStyle | undefined ): boolean {
	return Object.entries( getStyleObject( style ) ?? {} ).some(
		( [ key, value ] ) =>
			key === ROTATE_SUPPORT_KEY ||
			( key.startsWith( '@' ) &&
				isPlainObject( value ) &&
				value[ ROTATE_SUPPORT_KEY ] !== undefined )
	);
}

/**
 * Generates the CSS that rotates a block, including viewport overrides.
 *
 * The `rotate` property is used rather than `transform` so that it doesn't
 * clash with the transforms the editor applies to animate block moves.
 *
 * @param style            Block style attribute.
 * @param selector         Selector of the block.
 * @param viewportSettings Viewport breakpoint settings.
 *
 * @return The generated stylesheet.
 */
export function getRotateCSS(
	style: BlockStyle | undefined,
	selector: string,
	viewportSettings?: Record< string, unknown >
): string {
	const rules: string[] = [];
	const rotate = getRotateValue( getStyleObject( style )?.rotate );
	if ( rotate ) {
		rules.push( `${ selector }{rotate:${ rotate }deg;}` );
	}

	Object.entries( getResponsiveMediaQueries( viewportSettings ) ).forEach(
		( [ viewport, mediaQuery ] ) => {
			const viewportRotate = getRotateValue(
				getRotateStateStyle( style, { viewport } )?.rotate
			);
			if ( viewportRotate === undefined ) {
				return;
			}
			// In a viewport, 0 undoes the default rotation.
			const value = viewportRotate ? `${ viewportRotate }deg` : 'none';
			rules.push( `${ mediaQuery }{${ selector }{rotate:${ value };}}` );
		}
	);

	return rules.join( '' );
}

/**
 * Filters registered block settings, extending attributes to include the
 * `style` attribute that rotation is stored in.
 *
 * @param settings Original block settings.
 *
 * @return Filtered block settings.
 */
function addAttribute( settings: BlockType ): BlockType {
	if ( ! hasRotateSupport( settings ) || settings.attributes?.style ) {
		return settings;
	}

	settings.attributes = {
		...settings.attributes,
		style: {
			type: 'object',
		},
	};

	return settings;
}

/**
 * Removes the rotation from a block's attributes. The inspector controls
 * scope it to the selected style state.
 *
 * @param attributes Block attributes.
 *
 * @return The block attributes without rotation.
 */
function resetRotate( attributes: BlockAttributes ): BlockAttributes {
	return {
		...attributes,
		style: cleanEmptyObject( {
			...attributes.style,
			rotate: undefined,
		} ),
	};
}

function RotateControl( { clientId, setAttributes, style }: RotateEditProps ) {
	const { blockEditingMode, selectedState } = useSelect(
		( select ) => {
			const { getBlockEditingMode, getSelectedBlockStyleState } =
				select( blockEditorStore );
			return {
				blockEditingMode: getBlockEditingMode( clientId ),
				selectedState: getSelectedBlockStyleState( clientId ),
			};
		},
		[ clientId ]
	);

	if (
		blockEditingMode !== 'default' ||
		hasPseudoBlockStyleState( selectedState )
	) {
		return null;
	}

	const stateStyle = getRotateStateStyle( style, selectedState );
	const updateRotate = ( angle: number | undefined ) =>
		setAttributes( {
			style: getUpdatedRotateStyle( style, angle, selectedState ),
		} );

	return (
		// The provider scopes the panel's "Reset all" to the selected state.
		<BlockStyleStateProvider value={ selectedState }>
			<InspectorControls
				group="dimensions"
				resetAllFilter={ resetRotate }
			>
				<ToolsPanelItem
					hasValue={ () => stateStyle?.rotate !== undefined }
					label={ __( 'Rotation' ) }
					onDeselect={ () => updateRotate( undefined ) }
					isShownByDefault={ false }
					panelId={ clientId }
				>
					<AnglePickerControl
						label={ __( 'Rotation' ) }
						value={ toPickerAngle(
							getRotateForState( style, selectedState )
						) }
						onChange={ ( value ) =>
							updateRotate( fromPickerAngle( value ) )
						}
					/>
				</ToolsPanelItem>
			</InspectorControls>
		</BlockStyleStateProvider>
	);
}

function RotateEdit( props: RotateEditProps ) {
	if ( ! isRotateEnabled( props.name ) ) {
		return null;
	}
	return <RotateControl { ...props } />;
}

function useBlockProps( {
	clientId,
	style,
}: Pick< RotateEditProps, 'clientId' | 'style' > ) {
	const [ viewportSettings ] = useSettings( 'viewport' );
	const className = useInstanceId(
		ROTATE_BLOCK_PROPS_REFERENCE,
		'wp-rotate'
	);
	const css = useMemo(
		() => getRotateCSS( style, `.${ className }`, viewportSettings ),
		[ style, className, viewportSettings ]
	);

	usePrivateStyleOverride( { css, clientId } );

	return css ? { className } : {};
}

export default {
	edit: RotateEdit,
	useBlockProps,
	attributeKeys: [ 'style' ],
	hasSupport: hasRotateSupport,
	isMatch: ( { style }: { style?: BlockStyle } ) => hasRotateValue( style ),
};

addFilter(
	'blocks.registerBlockType',
	'core/rotate/addAttribute',
	addAttribute
);
