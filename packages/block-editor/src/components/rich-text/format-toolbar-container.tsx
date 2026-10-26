import { __ } from '@wordpress/i18n';
import { Popover, ToolbarGroup } from '@wordpress/components';
import { useAnchor } from '@wordpress/rich-text';
import { useEffect, useRef, useState } from '@wordpress/element';
import type { RefObject } from 'react';
import BlockControls from '../block-controls';
import FormatToolbar, { SelectionFormatToolbar } from './format-toolbar';
import NavigableToolbar from '../navigable-toolbar';
import { isBlockToolbarRedesignEnabled } from '../../utils/block-toolbar-redesign';
import type { FormatToolbarContainerProps } from './types';

function InlineToolbar( {
	popoverAnchor,
}: {
	popoverAnchor?: HTMLElement | null;
} ) {
	return (
		<Popover
			placement="top"
			focusOnMount={ false }
			anchor={ popoverAnchor }
			className="block-editor-rich-text__inline-format-toolbar"
			__unstableSlotName="block-toolbar"
		>
			<NavigableToolbar
				className="block-editor-rich-text__inline-format-toolbar-group"
				/* translators: accessibility text for the inline format toolbar */
				aria-label={ __( 'Format tools' ) }
			>
				<ToolbarGroup>
					<FormatToolbar />
				</ToolbarGroup>
			</NavigableToolbar>
		</Popover>
	);
}

/**
 * Tracks whether focus is in the editable element or in the selection
 * toolbar. Focus moving anywhere else, such as the block toolbar, hides the
 * selection toolbar. That also keeps the format slots it renders free for
 * the block options menu, which renders some of the same slots.
 *
 * @param editableContentElement The editable element.
 * @param toolbarRef             The selection toolbar element.
 * @return Whether focus is in the editable element or the toolbar.
 */
function useHasFocusWithin(
	editableContentElement: HTMLElement | null | undefined,
	toolbarRef: RefObject< HTMLElement | null >
) {
	const [ hasFocus, setHasFocus ] = useState( () => {
		const activeElement =
			editableContentElement?.ownerDocument.activeElement;
		return (
			!! activeElement &&
			!! editableContentElement?.contains( activeElement )
		);
	} );

	useEffect( () => {
		if ( ! editableContentElement ) {
			return;
		}
		const canvasDocument = editableContentElement.ownerDocument;
		const frameElement = canvasDocument.defaultView?.frameElement;
		const editorDocument = frameElement?.ownerDocument;

		function onCanvasFocusIn( event: FocusEvent ) {
			setHasFocus(
				!! editableContentElement?.contains( event.target as Node )
			);
		}

		function onEditorFocusIn( event: FocusEvent ) {
			// Focus going into the canvas is handled by the canvas listener.
			if ( event.target === frameElement ) {
				return;
			}
			setHasFocus(
				!! toolbarRef.current?.contains( event.target as Node )
			);
		}

		canvasDocument.addEventListener( 'focusin', onCanvasFocusIn );
		if ( editorDocument && editorDocument !== canvasDocument ) {
			editorDocument.addEventListener( 'focusin', onEditorFocusIn );
		}
		return () => {
			canvasDocument.removeEventListener( 'focusin', onCanvasFocusIn );
			editorDocument?.removeEventListener( 'focusin', onEditorFocusIn );
		};
	}, [ editableContentElement, toolbarRef ] );

	return hasFocus;
}

/**
 * Whether the selection starts on the first line of the editable element,
 * where a toolbar above it would cover the block toolbar.
 *
 * @param editableContentElement The editable element.
 * @return Whether the selection starts on the first line.
 */
function isSelectionOnFirstLine( editableContentElement: HTMLElement ) {
	const selection =
		editableContentElement.ownerDocument.defaultView?.getSelection();
	if ( ! selection?.rangeCount ) {
		return false;
	}
	const [ firstRect ] = Array.from(
		selection.getRangeAt( 0 ).getClientRects()
	);
	if ( ! firstRect ) {
		return false;
	}
	const editableRect = editableContentElement.getBoundingClientRect();
	return firstRect.top - editableRect.top < firstRect.height;
}

/**
 * The format toolbar of the block toolbar redesign. It appears above the
 * selected text, or below it when the selection is on the first line, so
 * it does not cover the block toolbar.
 *
 * @param props                        Component props.
 * @param props.editableContentElement The editable element.
 * @param props.isCollapsed            Whether the selection is collapsed.
 */
function SelectionToolbar( {
	editableContentElement,
	isCollapsed,
}: {
	editableContentElement?: HTMLElement | null;
	isCollapsed?: boolean;
} ) {
	const toolbarRef = useRef< HTMLDivElement >( null );
	const hasFocus = useHasFocusWithin( editableContentElement, toolbarRef );
	const anchor = useAnchor( {
		editableContentElement: editableContentElement ?? null,
	} );

	if ( isCollapsed || ! hasFocus || ! editableContentElement || ! anchor ) {
		return null;
	}

	const placement = isSelectionOnFirstLine( editableContentElement )
		? 'bottom'
		: 'top';

	return (
		<Popover
			ref={ toolbarRef }
			placement={ placement }
			focusOnMount={ false }
			anchor={ anchor }
			className="block-editor-rich-text__selection-format-toolbar"
			__unstableSlotName="block-toolbar"
		>
			<NavigableToolbar
				className="block-editor-rich-text__inline-format-toolbar-group"
				/* translators: accessibility text for the inline format toolbar */
				aria-label={ __( 'Format tools' ) }
			>
				<SelectionFormatToolbar />
			</NavigableToolbar>
		</Popover>
	);
}

const FormatToolbarContainer = ( {
	inline,
	editableContentElement,
	isCollapsed,
}: FormatToolbarContainerProps ) => {
	if ( isBlockToolbarRedesignEnabled() ) {
		return (
			<SelectionToolbar
				editableContentElement={ editableContentElement }
				isCollapsed={ isCollapsed }
			/>
		);
	}

	if ( inline ) {
		return <InlineToolbar popoverAnchor={ editableContentElement } />;
	}

	// Render regular toolbar.
	return (
		<BlockControls group="inline">
			<FormatToolbar />
		</BlockControls>
	);
};

export default FormatToolbarContainer;
