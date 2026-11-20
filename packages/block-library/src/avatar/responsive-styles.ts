import {
	getStyleForState,
	setStyleForState,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { unlock } from '../lock-unlock';

const { cleanEmptyObject } = unlock( blockEditorPrivateApis );

export interface AvatarAttributes {
	userId?: number;
	size?: number;
	isLink?: boolean;
	linkTarget?: string;
	style?: Record< string, any >;
}

export interface BlockStyleState {
	viewport?: string;
	pseudo?: string;
}

export interface GetActiveAvatarSizeOptions {
	attributes?: AvatarAttributes;
	selectedState?: BlockStyleState;
}

export interface HasViewportAvatarSizeOptions {
	attributes?: AvatarAttributes;
	selectedState?: BlockStyleState;
}

export interface GetUpdatedAvatarSizeAttributesOptions {
	attributes?: AvatarAttributes;
	selectedState?: BlockStyleState;
	newSize?: number | null;
}

export interface GetResetAvatarSizeAttributesOptions {
	attributes?: AvatarAttributes;
	selectedState?: BlockStyleState;
}

export interface UpdatedAvatarSizeAttributes {
	size?: number;
	style?: Record< string, any >;
}

/**
 * Returns true when a viewport style state is active.
 *
 * @param selectedState Selected block style state.
 * @return Whether a viewport state is active.
 */
export function isViewportStyleState(
	selectedState?: BlockStyleState
): boolean {
	return !! selectedState?.viewport && selectedState.viewport !== 'default';
}

/**
 * Returns the active avatar size value for the block.
 *
 * In a responsive viewport state, this reads the state's dimensions width style
 * and parses it into a number. In the default state, this reads the `size` block
 * attribute (falling back to 96).
 *
 * @param options               Options.
 * @param options.attributes    Avatar block attributes.
 * @param options.selectedState Currently selected block style state.
 * @return Active size in pixels.
 */
export function getActiveAvatarSize(
	options: GetActiveAvatarSizeOptions
): number {
	const { attributes, selectedState } = options;

	if ( isViewportStyleState( selectedState ) && selectedState?.viewport ) {
		const stateStyle = getStyleForState( attributes?.style, {
			viewport: selectedState.viewport,
		} ) as Record< string, any > | undefined;
		const width = stateStyle?.dimensions?.width;
		if ( typeof width === 'string' ) {
			const parsed = parseInt( width, 10 );
			if ( ! Number.isNaN( parsed ) ) {
				return parsed;
			}
		}
	}

	return attributes?.size ?? 96;
}

/**
 * Returns whether a viewport state has an image size override set.
 *
 * @param options               Options.
 * @param options.attributes    Avatar block attributes.
 * @param options.selectedState Currently selected block style state.
 * @return Whether an image size override is set for the viewport.
 */
export function hasViewportAvatarSize(
	options: HasViewportAvatarSizeOptions
): boolean {
	const { attributes, selectedState } = options;

	if (
		! isViewportStyleState( selectedState ) ||
		! selectedState?.viewport
	) {
		return false;
	}

	const stateStyle = getStyleForState( attributes?.style, {
		viewport: selectedState.viewport,
	} ) as Record< string, any > | undefined;

	return !! (
		stateStyle?.dimensions?.width || stateStyle?.dimensions?.height
	);
}

/**
 * Returns updated block attributes after changing the image size.
 *
 * In a viewport state, this updates the viewport's `dimensions.width` and `dimensions.height` styles.
 * In the default state, this updates the block's `size` attribute.
 *
 * @param options               Options.
 * @param options.attributes    Current Avatar block attributes.
 * @param options.selectedState Currently selected block style state.
 * @param options.newSize       Selected image size in pixels.
 * @return Attributes to set on the block.
 */
export function getUpdatedAvatarSizeAttributes(
	options: GetUpdatedAvatarSizeAttributesOptions
): UpdatedAvatarSizeAttributes {
	const { attributes, selectedState, newSize } = options;

	if (
		! isViewportStyleState( selectedState ) ||
		! selectedState?.viewport
	) {
		return {
			size: newSize ?? 96,
		};
	}

	const currentStyle = attributes?.style;
	const viewport = selectedState.viewport;
	const stateStyle = ( getStyleForState( currentStyle, { viewport } ) ||
		{} ) as Record< string, any >;

	const stateDimensions =
		typeof stateStyle.dimensions === 'object' && stateStyle.dimensions
			? stateStyle.dimensions
			: {};

	const nextDimensions = cleanEmptyObject( {
		...stateDimensions,
		width: newSize ? `${ newSize }px` : undefined,
		height: newSize ? `${ newSize }px` : undefined,
	} );

	const nextStateStyle = cleanEmptyObject( {
		...stateStyle,
		dimensions: nextDimensions,
	} );

	return {
		style: setStyleForState(
			currentStyle,
			{ viewport },
			nextStateStyle
		) as Record< string, any > | undefined,
	};
}

/**
 * Returns updated block attributes after resetting the image size.
 *
 * In a viewport state, this resets the viewport's dimensions width and height.
 * In the default state, this resets the `size` attribute to 96.
 *
 * @param options               Options.
 * @param options.attributes    Current Avatar block attributes.
 * @param options.selectedState Currently selected block style state.
 * @return Attributes to set on the block.
 */
export function getResetAvatarSizeAttributes(
	options: GetResetAvatarSizeAttributesOptions
): UpdatedAvatarSizeAttributes {
	const { attributes, selectedState } = options;

	if (
		! isViewportStyleState( selectedState ) ||
		! selectedState?.viewport
	) {
		return {
			size: 96,
		};
	}

	return getUpdatedAvatarSizeAttributes( {
		attributes,
		selectedState,
		newSize: null,
	} );
}
