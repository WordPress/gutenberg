import type { ForwardedRef, IframeHTMLAttributes, ReactNode, Ref } from 'react';

/**
 * A CSS rule the compatibility styles match on: a style rule's selector, or
 * a condition rule's condition and nested rules.
 */
export type CompatibilityCSSRule = CSSRule &
	Partial< Pick< CSSStyleRule, 'selectorText' > > &
	Partial< Pick< CSSConditionRule, 'conditionText' | 'cssRules' > >;

/**
 * A state of the zoom out transition.
 */
export interface TransitionState {
	/**
	 * Scale of the canvas.
	 */
	scaleValue: number;
	/**
	 * Size of the frame/offset around the canvas.
	 */
	frameSize: number;
	/**
	 * containerHeight of the iframe.
	 */
	containerHeight: number;
	/**
	 * ScrollTop of the iframe.
	 */
	scrollTop: number;
	/**
	 * ScrollHeight of the iframe.
	 */
	scrollHeight: number;
}

/**
 * The size of an observed element, `null` until it is measured.
 */
export interface ObservedSize {
	width: number | null;
	height: number | null;
}

/**
 * Options of `useScaleCanvas`.
 */
export interface ScaleCanvasOptions {
	/**
	 * Size of the frame around the content.
	 */
	frameSize: number;
	/**
	 * Document of the iframe.
	 */
	iframeDocument: Document;
	/**
	 * Max width of the canvas to use as the starting scale point.
	 */
	maxContainerWidth?: number;
	/**
	 * Scale of the canvas: a decimal between 0 and 1, 1, or 'auto-scaled'.
	 */
	scale: number | 'auto-scaled';
}

/**
 * The result of `useScaleCanvas`.
 */
export interface ScaleCanvasResult {
	/**
	 * Whether the canvas is zoomed out.
	 */
	isZoomedOut: boolean;
	/**
	 * The width of the container used to calculate the scale.
	 */
	scaleContainerWidth: number;
	/**
	 * A callback ref to the content element.
	 */
	contentRef: ( element?: Element | null ) => void;
	/**
	 * A callback ref to the container element.
	 */
	containerRef: ( element?: Element | null ) => void;
}

/**
 * Props of `Iframe`. Other props are passed to the `iframe` element.
 */
export type IframeProps = IframeHTMLAttributes< HTMLIFrameElement > & {
	/**
	 * A ref to the body of the iframe document.
	 */
	contentRef?: Ref< HTMLElement >;
	children?: ReactNode;
	/**
	 * Scale of the canvas: a decimal between 0 and 1, 1, or 'auto-scaled'.
	 */
	scale?: number | 'auto-scaled';
	/**
	 * Size of the frame around the content.
	 */
	frameSize?: number | string;
	/**
	 * Whether the content is read only.
	 */
	readonly?: boolean;
	forwardedRef?: ForwardedRef< HTMLIFrameElement >;
};

/**
 * An event constructor `bubbleEvent` creates the parent document's event with.
 */
export type EventConstructor = new (
	type: string,
	init?: Record< string, unknown >
) => Event;
