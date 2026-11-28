import clsx from 'clsx';
import { Button } from '@wordpress/components';
import { ESCAPE } from '@wordpress/keycodes';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { closeSmall } from '@wordpress/icons';
import {
	useFocusOnMount,
	useFocusReturn,
	useMergeRefs,
	useRefEffect,
} from '@wordpress/compose';
import { useRef } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';
import { unlock } from '../../lock-unlock';
import StylesCanvasStyleBook from './style-book';
import StylesCanvasRevisions from './revisions';
import { store as editorStore } from '../../store';
import ResizableEditor from '../resizable-editor';

/**
 * Helper function to get the title for the styles canvas based on current state.
 *
 * @param {string}  path          Current styles path.
 * @param {boolean} showStylebook Whether stylebook is visible.
 * @return {string} Translated string for the canvas title.
 */
export function getStylesCanvasTitle( path, showStylebook ) {
	if ( showStylebook ) {
		return __( 'Style Book' );
	}
	if ( path?.startsWith( '/revisions' ) ) {
		return __( 'Style Revisions' );
	}
	return '';
}

/**
 * Styles canvas component - orchestrates rendering of style book and revisions.
 * Determines what content to show based on global styles navigation state.
 *
 * @return {React.JSX.Element} The styles canvas or null if nothing to render.
 */
export default function StylesCanvas() {
	const { stylesPath, showStylebook, showListViewByDefault, isPreviewMode } =
		useSelect( ( select ) => {
			const { getStylesPath, getShowStylebook } = unlock(
				select( editorStore )
			);

			const _showListViewByDefault = select( preferencesStore ).get(
				'core',
				'showListViewByDefault'
			);

			return {
				stylesPath: getStylesPath(),
				showStylebook: getShowStylebook(),
				showListViewByDefault: _showListViewByDefault,
				isPreviewMode:
					select( editorStore ).getEditorSettings().isPreviewMode,
			};
		}, [] );
	const { resetStylesNavigation, setStylesPath } = unlock(
		useDispatch( editorStore )
	);
	const { setIsListViewOpened } = useDispatch( editorStore );

	const focusOnMountRef = useFocusOnMount( 'firstElement' );
	const sectionFocusReturnRef = useFocusReturn();
	const sectionRef = useMergeRefs( [
		sectionFocusReturnRef,
		focusOnMountRef,
	] );
	const restoreCloseFocusRef = useRef( false );
	const closeButtonRef = useRefEffect(
		( /** @type {HTMLButtonElement} */ node ) => {
			if ( restoreCloseFocusRef.current ) {
				node.focus( { preventScroll: true } );
				restoreCloseFocusRef.current = false;
			}
			return () => {
				// Keep focus on Close when a loaded revision replaces the loading view.
				restoreCloseFocusRef.current =
					node.ownerDocument.activeElement === node;
			};
		},
		[]
	);

	const title = getStylesCanvasTitle( stylesPath, showStylebook );
	const onCloseCanvas = () => {
		setIsListViewOpened( showListViewByDefault );
		resetStylesNavigation();
	};
	const closeButton = ! isPreviewMode && (
		<Button
			ref={ closeButtonRef }
			size="compact"
			className="editor-styles-canvas__close-button"
			icon={ closeSmall }
			label={ __( 'Close' ) }
			onClick={ onCloseCanvas }
		/>
	);

	// Determine what content to render
	let content = null;

	if ( showStylebook ) {
		content = (
			<StylesCanvasStyleBook
				path={ stylesPath }
				onPathChange={ setStylesPath }
				headerActions={ closeButton }
			/>
		);
	} else if ( stylesPath?.startsWith( '/revisions' ) ) {
		content = <StylesCanvasRevisions path={ stylesPath } />;
	}

	const closeOnEscape = ( event ) => {
		if ( event.keyCode === ESCAPE && ! event.defaultPrevented ) {
			event.preventDefault();
			onCloseCanvas();
		}
	};

	// In preview mode (e.g. the styles route of the extensible site editor),
	// the canvas is not opened over an editing session: whatever opened it
	// owns closing it, so the close affordances would only desync that owner.
	return (
		<div
			className={ clsx( 'editor-styles-canvas', {
				'is-preview-mode': isPreviewMode,
			} ) }
		>
			<ResizableEditor enableResizing={ false }>
				<section
					className="editor-styles-canvas__section"
					ref={ isPreviewMode ? sectionFocusReturnRef : sectionRef }
					onKeyDown={ isPreviewMode ? undefined : closeOnEscape }
					aria-label={ title }
				>
					{ ! showStylebook && closeButton }
					{ content }
				</section>
			</ResizableEditor>
		</div>
	);
}
