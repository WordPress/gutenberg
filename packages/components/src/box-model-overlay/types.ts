/**
 * External dependencies
 */
import type { RefObject, ReactElement } from 'react';

type BoxModelSides = 'top' | 'right' | 'bottom' | 'left';

export interface BoxModelOverlayHandle {
	update: () => void;
}

export interface BoxModelOverlayBaseProps {
	showValues: {
		margin?: {
			[ side in BoxModelSides ]?: boolean;
		};
		padding?: {
			[ side in BoxModelSides ]?: boolean;
		};
	};
}

export interface BoxModelOverlayPropsWithTargetRef
	extends BoxModelOverlayBaseProps {
	targetRef: RefObject< HTMLElement >;
}

export interface BoxModelOverlayPropsWithChildren
	extends BoxModelOverlayBaseProps {
	children: ReactElement;
}

export type BoxModelOverlayProps =
	| BoxModelOverlayPropsWithTargetRef
	| BoxModelOverlayPropsWithChildren;
