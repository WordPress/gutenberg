import { FlexItem, Flex, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { styles, seen, backup } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';
import { useViewportMatch, usePrevious } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { store as interfaceStore } from '@wordpress/interface';
import { store as blockEditorStore } from '@wordpress/block-editor';
import GlobalStylesUI from '../global-styles';
import { GlobalStylesActionMenu } from '../global-styles/menu';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import DefaultSidebar from './default-sidebar';
import WelcomeGuideStyles from './welcome-guide';
import { STYLE_BOOK_NOTES_SIDEBAR } from '../collab-sidebar/constants';

export const GLOBAL_STYLES_SIDEBAR = 'edit-site/global-styles';

/*
 * Complementary areas that belong to the styles experience.
 *
 * Opening any other area means the user has left Styles, and the styles
 * navigation - including the Style Book - is reset. The Style Book notes
 * sidebar is part of that experience rather than a departure from it: it holds
 * notes about the Style Book the user is looking at, so moving between the two
 * has to leave the canvas standing.
 */
const STYLES_COMPLEMENTARY_AREAS = [
	GLOBAL_STYLES_SIDEBAR,
	STYLE_BOOK_NOTES_SIDEBAR,
];

export default function GlobalStylesSidebar() {
	const {
		shouldResetNavigation,
		stylesPath,
		showStylebook,
		showListViewByDefault,
		hasRevisions,
		activeComplementaryArea,
		editorSettings,
		styleStateViewport,
	} = useSelect( ( select ) => {
		const { getActiveComplementaryArea } = select( interfaceStore );
		const { getStylesPath, getShowStylebook } = unlock(
			select( editorStore )
		);
		const _isVisualEditorMode =
			'visual' === select( editorStore ).getEditorMode();
		const _showListViewByDefault = select( preferencesStore ).get(
			'core',
			'showListViewByDefault'
		);
		const { getEntityRecord, __experimentalGetCurrentGlobalStylesId } =
			select( coreStore );

		const globalStylesId = __experimentalGetCurrentGlobalStylesId();
		const globalStyles = globalStylesId
			? getEntityRecord( 'root', 'globalStyles', globalStylesId )
			: undefined;

		return {
			stylesPath: getStylesPath(),
			showStylebook: getShowStylebook(),
			shouldResetNavigation:
				! STYLES_COMPLEMENTARY_AREAS.includes(
					getActiveComplementaryArea( 'core' )
				) || ! _isVisualEditorMode,
			showListViewByDefault: _showListViewByDefault,
			hasRevisions:
				!! globalStyles?._links?.[ 'version-history' ]?.[ 0 ]?.count,
			activeComplementaryArea:
				select( interfaceStore ).getActiveComplementaryArea( 'core' ),
			editorSettings: select( editorStore ).getEditorSettings(),
			styleStateViewport: unlock(
				select( blockEditorStore )
			).getStyleStateViewport(),
		};
	}, [] );
	const { setStylesPath, setShowStylebook, resetStylesNavigation } = unlock(
		useDispatch( editorStore )
	);
	const isMobileViewport = useViewportMatch( 'medium', '<' );

	// Derive state from path and showStylebook
	const isRevisionsOpened =
		stylesPath.startsWith( '/revisions' ) && ! showStylebook;
	const isRevisionsStyleBookOpened =
		stylesPath.startsWith( '/revisions' ) && showStylebook;

	const previousActiveArea = usePrevious( activeComplementaryArea );

	// Reset navigation when the sidebar opens, but only on a fresh entry into
	// Styles - coming back from the notes sidebar is a return, not an opening,
	// and resetting there would close the Style Book the notes are about.
	useEffect( () => {
		if (
			activeComplementaryArea === GLOBAL_STYLES_SIDEBAR &&
			! STYLES_COMPLEMENTARY_AREAS.includes( previousActiveArea )
		) {
			resetStylesNavigation();
		}
	}, [ activeComplementaryArea, previousActiveArea, resetStylesNavigation ] );

	useEffect( () => {
		if ( shouldResetNavigation ) {
			resetStylesNavigation();
		}
	}, [ shouldResetNavigation, resetStylesNavigation ] );

	const { setIsListViewOpened } = useDispatch( editorStore );

	const toggleRevisions = () => {
		setIsListViewOpened( false );
		if ( isRevisionsOpened || isRevisionsStyleBookOpened ) {
			// Close revisions, go back to root
			setStylesPath( '/' );
		} else {
			// Open revisions
			setStylesPath( '/revisions' );
		}
	};
	const toggleStyleBook = () => {
		setIsListViewOpened( showStylebook && showListViewByDefault );
		setShowStylebook( ! showStylebook );
	};

	return (
		<>
			<DefaultSidebar
				className="editor-global-styles-sidebar"
				identifier={ GLOBAL_STYLES_SIDEBAR }
				title={ __( 'Styles' ) }
				icon={ styles }
				closeLabel={ __( 'Close Styles' ) }
				panelClassName="editor-global-styles-sidebar__panel"
				header={
					<Flex
						className="editor-global-styles-sidebar__header"
						gap={ 1 }
					>
						<FlexItem>
							<h2 className="editor-global-styles-sidebar__header-title">
								{ __( 'Styles' ) }
							</h2>
						</FlexItem>
						<Flex
							justify="flex-end"
							gap={ 1 }
							className="editor-global-styles-sidebar__header-actions"
						>
							{ ! isMobileViewport && (
								<FlexItem>
									<Button
										icon={ seen }
										label={ __( 'Style Book' ) }
										isPressed={ showStylebook }
										accessibleWhenDisabled
										disabled={ shouldResetNavigation }
										onClick={ toggleStyleBook }
										size="compact"
									/>
								</FlexItem>
							) }
							<FlexItem>
								<Button
									label={ __( 'Revisions' ) }
									icon={ backup }
									onClick={ toggleRevisions }
									accessibleWhenDisabled
									disabled={ ! hasRevisions }
									isPressed={
										isRevisionsOpened ||
										isRevisionsStyleBookOpened
									}
									size="compact"
								/>
							</FlexItem>
							<GlobalStylesActionMenu
								onChangePath={ setStylesPath }
							/>
						</Flex>
					</Flex>
				}
			>
				<GlobalStylesUI
					path={ stylesPath }
					onPathChange={ setStylesPath }
					settings={ editorSettings }
					selectedViewport={ styleStateViewport }
					showResponsiveStateControls={ false }
				/>
			</DefaultSidebar>
			<WelcomeGuideStyles />
		</>
	);
}
