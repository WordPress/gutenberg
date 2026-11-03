import {
	getStyleForState,
	setStyleForState,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { unlock } from '../lock-unlock';

const { cleanEmptyObject } = unlock( blockEditorPrivateApis );

export const SIZE_TO_FONT_SIZE: Record< string, string > = {
	'has-small-icon-size': '16px',
	'has-normal-icon-size': '24px',
	'has-large-icon-size': '36px',
	'has-huge-icon-size': '48px',
};

export const FONT_SIZE_TO_SIZE: Record< string, string > = {
	'16px': 'has-small-icon-size',
	'24px': 'has-normal-icon-size',
	'36px': 'has-large-icon-size',
	'48px': 'has-huge-icon-size',
};

export interface SocialLinksAttributes {
	size?: string;
	style?: Record< string, any >;
}

export interface GetActiveIconSizeOptions {
	attributes?: SocialLinksAttributes;
	isViewportStyleState?: boolean;
	viewport?: string;
}

export interface HasViewportIconSizeOptions {
	attributes?: SocialLinksAttributes;
	viewport?: string;
}

export interface GetUpdatedIconSizeAttributesOptions {
	attributes?: SocialLinksAttributes;
	isViewportStyleState?: boolean;
	viewport?: string;
	newSize?: string | null;
}

export interface UpdatedIconSizeAttributes {
	size?: string;
	style?: Record< string, any >;
}

/**
 * Returns the active icon size value for the block.
 *
 * In a responsive viewport state, this reads the state's font size style and
 * maps it back to a size option class name. In the default state, this reads
 * the `size` block attribute.
 *
 * @param options                      Options.
 * @param options.attributes           Social Links block attributes.
 * @param options.isViewportStyleState Whether a viewport state is currently selected.
 * @param options.viewport             Currently selected viewport state.
 * @return Active icon size value, or null for default.
 */
export function getActiveIconSize(
	options: GetActiveIconSizeOptions
): string | null {
	const { attributes, isViewportStyleState, viewport } = options;

	if ( isViewportStyleState && viewport ) {
		const stateStyle = getStyleForState( attributes?.style, {
			viewport,
		} ) as Record< string, any > | undefined;
		const fontSize = stateStyle?.typography?.fontSize;
		return (
			( typeof fontSize === 'string' && FONT_SIZE_TO_SIZE[ fontSize ] ) ||
			null
		);
	}

	return attributes?.size || null;
}

/**
 * Returns whether a viewport state has an icon size override set.
 *
 * @param options            Options.
 * @param options.attributes Social Links block attributes.
 * @param options.viewport   Selected viewport state.
 * @return Whether an icon size override is set for the viewport.
 */
export function hasViewportIconSize(
	options: HasViewportIconSizeOptions
): boolean {
	const { attributes, viewport } = options;

	if ( ! viewport ) {
		return false;
	}
	const stateStyle = getStyleForState( attributes?.style, { viewport } ) as
		Record< string, any > | undefined;
	return !! stateStyle?.typography?.fontSize;
}

/**
 * Returns updated block attributes after changing the icon size.
 *
 * In a viewport state, this updates the viewport's `typography.fontSize` style.
 * In the default state, this updates the block's `size` attribute.
 *
 * @param options                      Options.
 * @param options.attributes           Current Social Links block attributes.
 * @param options.isViewportStyleState Whether a viewport state is currently selected.
 * @param options.viewport             Currently selected viewport state.
 * @param options.newSize              Selected icon size option value.
 * @return Attributes to set on the block.
 */
export function getUpdatedIconSizeAttributes(
	options: GetUpdatedIconSizeAttributesOptions
): UpdatedIconSizeAttributes {
	const { attributes, isViewportStyleState, viewport, newSize } = options;
	const normalizedSize = newSize || undefined;

	if ( ! isViewportStyleState || ! viewport ) {
		return {
			size: normalizedSize,
		};
	}

	const currentStyle = attributes?.style;
	const stateStyle = ( getStyleForState( currentStyle, { viewport } ) ||
		{} ) as Record< string, any >;
	const fontSize = normalizedSize
		? SIZE_TO_FONT_SIZE[ normalizedSize ]
		: undefined;

	const stateTypography =
		typeof stateStyle.typography === 'object' && stateStyle.typography
			? stateStyle.typography
			: {};

	const nextTypography = cleanEmptyObject( {
		...stateTypography,
		fontSize,
	} );

	const nextStateStyle = cleanEmptyObject( {
		...stateStyle,
		typography: nextTypography,
	} );

	return {
		style: setStyleForState(
			currentStyle,
			{ viewport },
			nextStateStyle
		) as Record< string, any > | undefined,
	};
}
