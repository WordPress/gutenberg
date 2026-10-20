import clsx from 'clsx';
import { __ } from '@wordpress/i18n';
import {
	DropdownMenu,
	Popover,
	Slot,
	ToolbarGroup,
	ToolbarItem,
} from '@wordpress/components';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { chevronDown } from '@wordpress/icons';
import NavigableToolbar from '../navigable-toolbar';
import { orderBy } from '../../utils/sorting';
import {
	getFillProps,
	useIsOptionsMenuOpen,
} from '../block-toolbar/redesign/utils';

const MORE_POPOVER_PROPS = { placement: 'bottom-start' } as const;

/**
 * Whether the document selection is a range of text inside the element.
 *
 * @param element The editable element.
 * @return The selected range, or null.
 */
function getSelectedRange( element: HTMLElement ): Range | null {
	const { ownerDocument } = element;
	const selection = ownerDocument.defaultView?.getSelection();
	if ( ! selection || selection.rangeCount === 0 || selection.isCollapsed ) {
		return null;
	}
	const range = selection.getRangeAt( 0 );
	if ( ! element.contains( range.commonAncestorContainer ) ) {
		return null;
	}
	return range;
}

/**
 * Tracks whether text is selected in the element, and where.
 *
 * @param element The editable element.
 * @return The selected range, or null when nothing is selected.
 */
function useTextSelection( element?: HTMLElement | null ): Range | null {
	const [ range, setRange ] = useState< Range | null >( null );

	useEffect( () => {
		if ( ! element ) {
			return;
		}
		const editable = element;
		const { ownerDocument } = editable;
		let isPointerDown = false;

		function update() {
			// Wait for the pointer to come up, so the toolbar doesn't jump
			// around under the cursor while a selection is being dragged.
			if ( isPointerDown ) {
				return;
			}
			const nextRange = getSelectedRange( editable );
			setRange( nextRange ? nextRange.cloneRange() : null );
		}

		function onPointerDown() {
			isPointerDown = true;
			setRange( null );
		}

		function onPointerUp() {
			isPointerDown = false;
			// The selection settles after the event.
			ownerDocument.defaultView?.requestAnimationFrame( update );
		}

		ownerDocument.addEventListener( 'selectionchange', update );
		editable.addEventListener( 'pointerdown', onPointerDown );
		ownerDocument.addEventListener( 'pointerup', onPointerUp );
		update();

		return () => {
			ownerDocument.removeEventListener( 'selectionchange', update );
			editable.removeEventListener( 'pointerdown', onPointerDown );
			ownerDocument.removeEventListener( 'pointerup', onPointerUp );
		};
	}, [ element ] );

	return range;
}

function SelectionToolbarMore() {
	return (
		<Slot name="RichText.ToolbarControls">
			{ ( fills: unknown ) => {
				const controls = getFillProps( fills );
				if ( ! controls.length ) {
					return null;
				}
				const hasActive = controls.some( ( { isActive } ) => isActive );
				return (
					<ToolbarItem>
						{ ( toggleProps: any ) => (
							<DropdownMenu
								icon={ chevronDown }
								/* translators: button label text should, if possible, be under 16 characters. */
								label={ __( 'More' ) }
								toggleProps={ {
									...toggleProps,
									className: clsx( toggleProps.className, {
										'is-pressed': hasActive,
									} ),
									description: __( 'More formatting' ),
								} }
								controls={ orderBy( controls, 'title' ) as any }
								popoverProps={ MORE_POPOVER_PROPS }
							/>
						) }
					</ToolbarItem>
				);
			} }
		</Slot>
	);
}

/**
 * The selection toolbar: formatting and link controls that appear above
 * selected text, kept apart from the block toolbar, which only has tools
 * that act on the whole block.
 *
 * It builds on the inline toolbar image captions already use, but only shows
 * while there is a text selection. The inline insert controls (inline image,
 * footnote, math) are not here: they live in the Insert menu of the block
 * options.
 *
 * @param props                        Component props.
 * @param props.editableContentElement The editable element.
 */
export default function SelectionToolbar( {
	editableContentElement,
}: {
	editableContentElement?: HTMLElement | null;
} ) {
	const range = useTextSelection( editableContentElement );
	const isOptionsMenuOpen = useIsOptionsMenuOpen();

	const anchor = useMemo( () => {
		if ( ! range || ! editableContentElement ) {
			return null;
		}
		return {
			getBoundingClientRect: () => range.getBoundingClientRect(),
			contextElement: editableContentElement,
			ownerDocument: editableContentElement.ownerDocument,
		};
	}, [ range, editableContentElement ] );

	// While the options menu is open it renders these slots itself.
	if ( ! anchor || isOptionsMenuOpen ) {
		return null;
	}

	return (
		<Popover
			// Below the text: the block toolbar sits above the block, and a
			// selection on its first line would put the two on top of each
			// other. It flips above when there's no room below.
			placement="bottom"
			focusOnMount={ false }
			anchor={ anchor }
			className="block-editor-rich-text__inline-format-toolbar block-editor-rich-text__selection-toolbar"
			__unstableSlotName="block-toolbar"
			shift
		>
			<NavigableToolbar
				className="block-editor-rich-text__inline-format-toolbar-group"
				/* translators: accessibility text for the toolbar that appears over selected text */
				aria-label={ __( 'Text tools' ) }
			>
				<ToolbarGroup>
					{ [
						'bold',
						'italic',
						'link',
						'unknown',
						'non-breaking-space',
					].map( ( format ) => (
						<Slot
							name={ `RichText.ToolbarControls.${ format }` }
							key={ format }
						/>
					) ) }
					<SelectionToolbarMore />
				</ToolbarGroup>
			</NavigableToolbar>
		</Popover>
	);
}
