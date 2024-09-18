/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useMergeRefs } from '@wordpress/compose';
import { Popover } from '@wordpress/components';
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
				const selectedBCR = selectedElement.getBoundingClientRect();
				const lastSelectedBCR =
					lastSelectedElement?.getBoundingClientRect();

				// Get the biggest rectangle that encompasses completely the currently
				// selected element and the last selected element:
				// - for top/left coordinates, use the smaller numbers
				// - for the bottom/right coordinates, use the largest numbers
				const left = Math.min(
					selectedBCR.left,
					lastSelectedBCR?.left ?? Infinity
				);
				const top = Math.min(
					selectedBCR.top,
					lastSelectedBCR?.top ?? Infinity
				);
				const right = Math.max(
					selectedBCR.right,
					lastSelectedBCR.right ?? -Infinity
				);
				const bottom = Math.max(
					selectedBCR.bottom,
					lastSelectedBCR.bottom ?? -Infinity
				);
				const width = right - left;
				const height = bottom - top;

				return new window.DOMRect( left, top, width, height );
			},
			contextElement: selectedElement,
		};
	}, [
		bottomClientId,
		lastSelectedElement,
		selectedElement,
		popoverDimensionsRecomputeCounter,
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
