import type { ComponentType, CSSProperties, ReactNode } from 'react';

/**
 * Props of the color selector icon.
 */
export interface ColorSelectorIconProps {
	/**
	 * Style object.
	 */
	style?: CSSProperties;
	/**
	 * Class name for component.
	 */
	className?: string;
}

/**
 * The components wrapping the color selector icon.
 */
export interface ColorSelectorWrappers {
	/**
	 * Text color component that wraps icon.
	 */
	TextColor: ComponentType< { children?: ReactNode } >;
	/**
	 * Background color component that wraps icon.
	 */
	BackgroundColor: ComponentType< { children?: ReactNode } >;
}

/**
 * Props of `BlockColorsStyleSelector`.
 */
export interface BlockColorsStyleSelectorProps extends ColorSelectorWrappers {
	children?: ReactNode;
}
