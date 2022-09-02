/**
 * External dependencies
 */
import type { ReactNode, MutableRefObject, SyntheticEvent } from 'react';
import type { Placement } from '@floating-ui/react-dom';

type PositionYAxis = 'top' | 'middle' | 'bottom';
type PositionXAxis = 'left' | 'center' | 'right';

// Official type as from the README, although there are instances where:
// - only one token is specified
// - three space separated string are passed
export type PopoverPosition = `${ PositionYAxis } ${ PositionXAxis }`;

type DomRectWithOwnerDocument = DOMRect & {
	ownerDocument?: Document;
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
		| Element
		| MutableRefObject< Element | null | undefined >
		| {
				top: Element | MutableRefObject< Element | null | undefined >;
				bottom:
					| Element
					| MutableRefObject< Element | null | undefined >;
		  }
		| {
				startContainer: Node | undefined;
		  };
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
	position?: PopoverPosition;
	resize?: boolean;

	// Deprecated props
	__unstableForcePosition?: boolean;
	range?: unknown;
};
