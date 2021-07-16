export type ResponsiveCSSValue< T > = Array< T | undefined > | T;

export type PopperPlacement =
	| 'auto'
	| 'auto-start'
	| 'auto-end'
	| 'top'
	| 'top-start'
	| 'top-end'
	| 'right'
	| 'right-start'
	| 'right-end'
	| 'bottom'
	| 'bottom-start'
	| 'bottom-end'
	| 'left'
	| 'left-start'
	| 'left-end';

export type PopperProps = {
	/**
	 * Position of the popover element.
	 *
	 * @default 'auto'
	 *
	 * @see https://popper.js.org/docs/v1/#popperplacements--codeenumcode
	 */
	placement?: PopperPlacement;
};

export type SizeRangeDefault =
	| 'xLarge'
	| 'large'
	| 'medium'
	| 'small'
	| 'xSmall';
