/**
 * External dependencies
 */
import type { MotionProps } from 'framer-motion';
import type { Placement, ReferenceType } from '@floating-ui/react-dom';

/**
 * Internal dependencies
 */
import type {
	PopoverProps,
	PopoverAnchorRefReference,
	PopoverAnchorRefTopBottom,
} from './types';

const POSITION_TO_PLACEMENT: Record<
	NonNullable< PopoverProps[ 'position' ] >,
	Placement
> = {
	bottom: 'bottom',
	top: 'top',
	'middle left': 'left',
	'middle right': 'right',
	'bottom left': 'bottom-end',
	'bottom center': 'bottom',
	'bottom right': 'bottom-start',
	'top left': 'top-end',
	'top center': 'top',
	'top right': 'top-start',
	'middle left left': 'left',
	'middle left right': 'left',
	'middle left bottom': 'left-end',
	'middle left top': 'left-start',
	'middle right left': 'right',
	'middle right right': 'right',
	'middle right bottom': 'right-end',
	'middle right top': 'right-start',
	'bottom left left': 'bottom-end',
	'bottom left right': 'bottom-end',
	'bottom left bottom': 'bottom-end',
	'bottom left top': 'bottom-end',
	'bottom center left': 'bottom',
	'bottom center right': 'bottom',
	'bottom center bottom': 'bottom',
	'bottom center top': 'bottom',
	'bottom right left': 'bottom-start',
	'bottom right right': 'bottom-start',
	'bottom right bottom': 'bottom-start',
	'bottom right top': 'bottom-start',
	'top left left': 'top-end',
	'top left right': 'top-end',
	'top left bottom': 'top-end',
	'top left top': 'top-end',
	'top center left': 'top',
	'top center right': 'top',
	'top center bottom': 'top',
	'top center top': 'top',
	'top right left': 'top-start',
	'top right right': 'top-start',
	'top right bottom': 'top-start',
	'top right top': 'top-start',
	// `middle`/`middle center [corner?]` positions are associated to a fallback
	// `bottom` placement because there aren't any corresponding placement values.
	middle: 'bottom',
	'middle center': 'bottom',
	'middle center bottom': 'bottom',
	'middle center left': 'bottom',
	'middle center right': 'bottom',
	'middle center top': 'bottom',
};

/**
 * Converts the `Popover`'s legacy "position" prop to the new "placement" prop
 * (used by `floating-ui`).
 *
 * @param position The legacy position
 * @return The corresponding placement
 */
export const positionToPlacement = (
	position: NonNullable< PopoverProps[ 'position' ] >
) => POSITION_TO_PLACEMENT[ position ] ?? 'bottom';

/**
 * @typedef AnimationOrigin
 * @type {Object}
 * @property {number} originX A number between 0 and 1 (in CSS logical properties jargon, 0 is "start", 0.5 is "center", and 1 is "end")
 * @property {number} originY A number between 0 and 1 (0 is top, 0.5 is center, and 1 is bottom)
 */

const PLACEMENT_TO_ANIMATION_ORIGIN: Record<
	NonNullable< PopoverProps[ 'placement' ] >,
	{ originX: number; originY: number }
> = {
	top: { originX: 0.5, originY: 1 }, // open from bottom, center
	'top-start': { originX: 0, originY: 1 }, // open from bottom, left
	'top-end': { originX: 1, originY: 1 }, // open from bottom, right
	right: { originX: 0, originY: 0.5 }, // open from middle, left
	'right-start': { originX: 0, originY: 0 }, // open from top, left
	'right-end': { originX: 0, originY: 1 }, // open from bottom, left
	bottom: { originX: 0.5, originY: 0 }, // open from top, center
	'bottom-start': { originX: 0, originY: 0 }, // open from top, left
	'bottom-end': { originX: 1, originY: 0 }, // open from top, right
	left: { originX: 1, originY: 0.5 }, // open from middle, right
	'left-start': { originX: 1, originY: 0 }, // open from top, right
	'left-end': { originX: 1, originY: 1 }, // open from bottom, right
	overlay: { originX: 0.5, originY: 0.5 }, // open from center, center
};

/**
 * Given the floating-ui `placement`, compute the framer-motion props for the
 * popover's entry animation.
 *
 * @param placement A placement string from floating ui
 * @return The object containing the motion props
 */
export const placementToMotionAnimationProps = (
	placement: NonNullable< PopoverProps[ 'placement' ] >
): MotionProps => {
	const translateProp =
		placement.startsWith( 'top' ) || placement.startsWith( 'bottom' )
			? 'translateY'
			: 'translateX';
	const translateDirection =
		placement.startsWith( 'top' ) || placement.startsWith( 'left' )
			? 1
			: -1;

	return {
		style: PLACEMENT_TO_ANIMATION_ORIGIN[ placement ],
		initial: {
			opacity: 0,
			scale: 0,
			[ translateProp ]: `${ 2 * translateDirection }em`,
		},
		animate: { opacity: 1, scale: 1, [ translateProp ]: 0 },
		transition: { duration: 0.1, ease: [ 0, 0, 0.2, 1 ] },
	};
};

function isTopBottom(
	anchorRef: PopoverProps[ 'anchorRef' ]
): anchorRef is PopoverAnchorRefTopBottom {
	return !! ( anchorRef as PopoverAnchorRefTopBottom )?.top;
}

function isRef(
	anchorRef: PopoverProps[ 'anchorRef' ]
): anchorRef is PopoverAnchorRefReference {
	return !! ( anchorRef as PopoverAnchorRefReference )?.current;
}

export const getReferenceElement = ( {
	anchor,
	anchorRef,
	anchorRect,
	getAnchorRect,
	fallbackReferenceElement,
}: Pick<
	PopoverProps,
	'anchorRef' | 'anchorRect' | 'getAnchorRect' | 'anchor'
> & {
	fallbackReferenceElement: Element | null;
} ): ReferenceType | null => {
	let referenceElement = null;

	if ( anchor ) {
		referenceElement = anchor;
	} else if ( isTopBottom( anchorRef ) ) {
		// Create a virtual element for the ref. The expectation is that
		// if anchorRef.top is defined, then anchorRef.bottom is defined too.
		// Seems to be used by the block toolbar, when multiple blocks are selected
		// (top and bottom blocks are used to calculate the resulting rect).
		referenceElement = {
			getBoundingClientRect() {
				const topRect = anchorRef.top.getBoundingClientRect();
				const bottomRect = anchorRef.bottom.getBoundingClientRect();
				return new window.DOMRect(
					topRect.x,
					topRect.y,
					topRect.width,
					bottomRect.bottom - topRect.top
				);
			},
		};
	} else if ( isRef( anchorRef ) ) {
		// Standard React ref.
		referenceElement = anchorRef.current;
	} else if ( anchorRef ) {
		// If `anchorRef` holds directly the element's value (no `current` key)
		// This is a weird scenario and should be deprecated.
		referenceElement = anchorRef as Element;
	} else if ( anchorRect ) {
		// Create a virtual element for the ref.
		referenceElement = {
			getBoundingClientRect() {
				return anchorRect;
			},
		};
	} else if ( getAnchorRect ) {
		// Create a virtual element for the ref.
		referenceElement = {
			getBoundingClientRect() {
				const rect = getAnchorRect( fallbackReferenceElement );
				return new window.DOMRect(
					rect.x ?? rect.left,
					rect.y ?? rect.top,
					rect.width ?? rect.right - rect.left,
					rect.height ?? rect.bottom - rect.top
				);
			},
		};
	} else if ( fallbackReferenceElement ) {
		// If no explicit ref is passed via props, fall back to
		// anchoring to the popover's parent node.
		referenceElement = fallbackReferenceElement.parentElement;
	}

	// Convert any `undefined` value to `null`.
	return referenceElement ?? null;
};

/**
 * Computes the final coordinate that needs to be applied to the floating
 * element when applying transform inline styles, defaulting to `undefined`
 * if the provided value is `null` or `NaN`.
 *
 * @param c input coordinate (usually as returned from floating-ui)
 * @return The coordinate's value to be used for inline styles. An `undefined`
 *         return value means "no style set" for this coordinate.
 */
export const computePopoverPosition = ( c: number | null ) =>
	c === null || Number.isNaN( c ) ? undefined : Math.round( c );
