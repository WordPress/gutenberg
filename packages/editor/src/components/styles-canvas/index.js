/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { ESCAPE } from '@wordpress/keycodes';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { closeSmall } from '@wordpress/icons';
import { useFocusOnMount, useFocusReturn } from '@wordpress/compose';
import { store as preferencesStore } from '@wordpress/preferences';
/**
 * Internal dependencies
 */
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
 * @return {JSX.Element|null} The styles canvas or null if nothing to render.
 */
export default function StylesCanvas() {
	const { stylesPath, showStylebook, showListViewByDefault } = useSelect(
		( select ) => {
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
			};
		},
		[]
	);
	const { resetStylesNavigation, setStylesPath } = unlock(
		useDispatch( editorStore )
	);
	const { setIsListViewOpened } = useDispatch( editorStore );

	const focusOnMountRef = useFocusOnMount( 'firstElement' );
	const sectionFocusReturnRef = useFocusReturn();

	// Determine what content to render
	let content = null;

	if ( showStylebook ) {
		content = (
			<StylesCanvasStyleBook
				path={ stylesPath }
				onPathChange={ setStylesPath }
				ref={ sectionFocusReturnRef }
			/>
		);
	} else if ( stylesPath?.startsWith( '/revisions' ) ) {
		content = (
			<StylesCanvasRevisions
				path={ stylesPath }
				ref={ sectionFocusReturnRef }
			/>
		);
	}

	const title = getStylesCanvasTitle( stylesPath, showStylebook );
	const onCloseCanvas = () => {
		setIsListViewOpened( showListViewByDefault );
		resetStylesNavigation();
	};

	const closeOnEscape = ( event ) => {
		if ( event.keyCode === ESCAPE && ! event.defaultPrevented ) {
			event.preventDefault();
			onCloseCanvas();
		}
	};

	return (
		<div className="editor-styles-canvas">
			<ResizableEditor enableResizing={ false }>
				{ /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */ }
				<section
					className="editor-styles-canvas__section"
					ref={ focusOnMountRef }
					onKeyDown={ closeOnEscape }
					aria-label={ title }
				>
					<Button
						size="compact"
						className="editor-styles-canvas__close-button"
						icon={ closeSmall }
						label={ __( 'Close' ) }
						onClick={ onCloseCanvas }
					/>
					{ content }
				</section>
			</ResizableEditor>
		</div>
	);
}
