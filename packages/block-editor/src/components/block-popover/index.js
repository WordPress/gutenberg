/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useMergeRefs } from '@wordpress/compose';
import { Popover } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import {
	forwardRef,
	useMemo,
	useReducer,
	useLayoutEffect,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useBlockElement } from '../block-list/use-block-props/use-block-refs';
import usePopoverScroll from './use-popover-scroll';
import { rectUnion, getVisibleElementBounds } from '../../utils/dom';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const MAX_POPOVER_RECOMPUTE_COUNTER = Number.MAX_SAFE_INTEGER;

function BlockPopover(
	{
		clientId,
		bottomClientId,
		children,
		__unstablePopoverSlot,
		__unstableContentRef,
		shift = true,
		...props
	},
	ref
) {
	const selectedElement = useBlockElement( clientId );
	const lastSelectedElement = useBlockElement( bottomClientId ?? clientId );
	const mergedRefs = useMergeRefs( [
		ref,
		usePopoverScroll( __unstableContentRef ),
	] );

	const [
		popoverDimensionsRecomputeCounter,
		forceRecomputePopoverDimensions,
	] = useReducer(
		// Module is there to make sure that the counter doesn't overflow.
		( s ) => ( s + 1 ) % MAX_POPOVER_RECOMPUTE_COUNTER,
		0
	);

	// When blocks are moved up/down, they are animated to their new position by
	// updating the `transform` property manually (i.e. without using CSS
	// transitions or animations). The animation, which can also scroll the block
	// editor, can sometimes cause the position of the Popover to get out of sync.
	// A MutationObserver is therefore used to make sure that changes to the
	// selectedElement's attribute (i.e. `transform`) can be tracked and used to
	// trigger the Popover to rerender.
	useLayoutEffect( () => {
		if ( ! selectedElement ) {
			return;
		}

		const observer = new window.MutationObserver(
			forceRecomputePopoverDimensions
		);
		observer.observe( selectedElement, { attributes: true } );

		return () => {
			observer.disconnect();
		};
	}, [ selectedElement ] );

	const { isZoomOut } = useSelect(
		( select ) => ( {
			isZoomOut: unlock( select( blockEditorStore ) ).isZoomOut(),
		} ),
		[]
	);

	const popoverAnchor = useMemo( () => {
		if (
			// popoverDimensionsRecomputeCounter is by definition always equal or greater
			// than 0. This check is only there to satisfy the correctness of the
			// exhaustive-deps rule for the `useMemo` hook.
			popoverDimensionsRecomputeCounter < 0 ||
			! selectedElement ||
			( bottomClientId && ! lastSelectedElement )
		) {
			return undefined;
		}

		return {
			getBoundingClientRect() {
				// The zoom out view has a vertical block toolbar that should always
				// be on the edge of the canvas. This condition changes the anchor
				// of the toolbar to the section instead of the block to handle blocks
				// that are not full width.
				if ( isZoomOut ) {
					const selectedBlockRect =
						getVisibleElementBounds( selectedElement );
					const sectionRootElementRect = getVisibleElementBounds(
						selectedElement.parentElement
					);
					const selectedBlockRectHeight =
						selectedBlockRect.bottom - selectedBlockRect.top;
					const sectionRootElementRectWidth =
						sectionRootElementRect.right -
						sectionRootElementRect.left;
					return new window.DOMRectReadOnly(
						sectionRootElementRect.left,
						selectedBlockRect.top,
						sectionRootElementRectWidth,
						selectedBlockRectHeight
					);
				}

				return lastSelectedElement
					? rectUnion(
							getVisibleElementBounds( selectedElement ),
							getVisibleElementBounds( lastSelectedElement )
					  )
					: getVisibleElementBounds( selectedElement );
			},
			contextElement: selectedElement,
		};
	}, [
		bottomClientId,
		lastSelectedElement,
		selectedElement,
		popoverDimensionsRecomputeCounter,
		isZoomOut,
	] );

	if ( ! selectedElement || ( bottomClientId && ! lastSelectedElement ) ) {
		return null;
	}

	return (
		<Popover
			ref={ mergedRefs }
			animate={ false }
			focusOnMount={ false }
			anchor={ popoverAnchor }
			// Render in the old slot if needed for backward compatibility,
			// otherwise render in place (not in the default popover slot).
			__unstableSlotName={ __unstablePopoverSlot }
			inline={ ! __unstablePopoverSlot }
			placement="top-start"
			resize={ false }
			flip={ false }
			shift={ shift }
			{ ...props }
			className={ clsx( 'block-editor-block-popover', props.className ) }
			variant="unstyled"
		>
			{ children }
		</Popover>
	);
}

export const PrivateBlockPopover = forwardRef( BlockPopover );

const PublicBlockPopover = (
	{ clientId, bottomClientId, children, ...props },
	ref
) => (
	<PrivateBlockPopover
		{ ...props }
		bottomClientId={ bottomClientId }
		clientId={ clientId }
		__unstableContentRef={ undefined }
		__unstablePopoverSlot={ undefined }
		ref={ ref }
	>
		{ children }
	</PrivateBlockPopover>
);

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-popover/README.md
 */
export default forwardRef( PublicBlockPopover );
