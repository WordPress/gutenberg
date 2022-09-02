/**
 * External dependencies
 */
import type { ReactNode, MutableRefObject, SyntheticEvent } from 'react';
import type { Placement } from '@floating-ui/react-dom';

type PositionYAxis = 'top' | 'middle' | 'bottom';
type PositionXAxis = 'left' | 'center' | 'right';

type DomRectWithOwnerDocument = DOMRect & {
	ownerDocument?: Document;
};

export type AnimatedWrapperProps = {
	placement: Placement;
	shouldAnimate?: boolean;
};

export type PopoverAnchorRefElement = Element;
export type PopoverAnchorRefReference = MutableRefObject<
	Element | null | undefined
>;
export type PopoverAnchorRefTopBottom = { top: Element; bottom: Element };
export type PopoverAnchorRefStartContainer = {
	startContainer: Node | undefined;
};

// TODO:
// - add all props
// - add deprecations, default values, descriptions
// - sync README
// - update places where Popover props may be reused
export type PopoverProps = {
	__unstableSlotName?: string;
	__unstableShift?: boolean;
	anchorRect?: DomRectWithOwnerDocument;
	anchorRef?:
		| PopoverAnchorRefElement
		| PopoverAnchorRefReference
		| PopoverAnchorRefTopBottom
		| PopoverAnchorRefStartContainer;
	animate?: true;
	children: ReactNode;
	expandOnMobile?: boolean;
	flip?: boolean;
	focusOnMount?: 'firstElement' | boolean;
	onFocusOutside?: ( event: SyntheticEvent ) => void;
	getAnchorRect?: (
		fallbackReferenceElement: Element | null
	) => DomRectWithOwnerDocument;
	headerTitle?: string;
	isAlternate?: boolean;
	noArrow?: boolean;
	offset?: number;
	onClose?: () => void;
	placement?: Placement;
	// Official type as from the README, although there are instances where:
	// - only one token is specified
	// - three space separated string are passed
	position?: `${ PositionYAxis } ${ PositionXAxis }`;
	resize?: boolean;

	// Deprecated props
	__unstableForcePosition?: boolean;
	range?: unknown;
};
