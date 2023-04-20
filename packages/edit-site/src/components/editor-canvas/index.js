/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Children, cloneElement, useMemo, useState } from '@wordpress/element';
import {
	createSlotFill,
	__experimentalUseSlotFills as useSlotFills,
	Button,
} from '@wordpress/components';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import {
	useResizeObserver,
	useFocusOnMount,
	useFocusReturn,
	useMergeRefs,
} from '@wordpress/compose';
import { ESCAPE } from '@wordpress/keycodes';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../private-apis';
import { EditorCanvasFillContext } from './context';
import { closeSmall } from '@wordpress/icons';

const { useGlobalStyle } = unlock( blockEditorPrivateApis );
const SLOT_FILL_NAME = 'EditSiteEditorCanvas';
const { Slot: EditorCanvasSlot, Fill: EditorCanvasFill } =
	createSlotFill( SLOT_FILL_NAME );

function EditorCanvas( { onClose, title, children } ) {
	const [ isClosed, setIsClosed ] = useState( false );
	const [ resizeObserver, sizes ] = useResizeObserver();
	const focusOnMountRef = useFocusOnMount( 'firstElement' );
	const sectionFocusReturnRef = useFocusReturn();
	const [ textColor ] = useGlobalStyle( 'color.text' );
	const [ backgroundColor ] = useGlobalStyle( 'color.background' );
	const contextProps = useMemo( () => ( { sizes } ), [ sizes ] );

	function closeOnEscape( event ) {
		if ( event.keyCode === ESCAPE && ! event.defaultPrevented ) {
			event.preventDefault();
			setIsClosed( true );
			onClose();
		}
	}

	const refs = useMergeRefs( [
		sectionFocusReturnRef,
		focusOnMountRef,
	] );

	if ( isClosed ) {
		return null;
	}

	const closeButtonLabel = sprintf(
		// translators: %s: Title of the canvas context.
		__( 'Close %s' ),
		title
	);

	return (
		<EditorCanvasFill>
			{ /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */ }
			<section
				className={ classnames( 'edit-site-edit-canvas', {
					'is-wide': sizes.width > 600,
				} ) }
				style={ {
					color: textColor,
					background: backgroundColor,
				} }
				aria-label={ title }
				onKeyDown={ closeOnEscape }
				ref={ refs }
			>
				{ resizeObserver }
				<Button
					className="edit-site-edit-canvas__close-button"
					icon={ closeSmall }
					label={ closeButtonLabel }
					onClick={ onClose }
					showTooltip={ false }
				/>
				<EditorCanvasFillContext.Provider value={ contextProps }>
					{ children }
				</EditorCanvasFillContext.Provider>
			</section>
		</EditorCanvasFill>
	);
}

function useHasEditorCanvasFill() {
	const fills = useSlotFills( SLOT_FILL_NAME );
	return !! fills?.length;
}

export default EditorCanvas;
export { useHasEditorCanvasFill, EditorCanvasSlot };
