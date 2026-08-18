import { Button } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
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
import PluginSidebar from '../plugin-sidebar';
import WelcomeGuideStyles from './welcome-guide';

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
		isDistractionFree,
	} = useSelect( ( select ) => {
		const { get } = select( preferencesStore );
		const { getActiveComplementaryArea } = select( interfaceStore );
		const {
			getStylesPath,
			getShowStylebook,
			getEditorMode,
			getEditorSettings,
		} = unlock( select( editorStore ) );
		const _isVisualEditorMode = 'visual' === getEditorMode();
		const _showListViewByDefault = get( 'core', 'showListViewByDefault' );
		const _isDistractionFree = get( 'core', 'distractionFree' );
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
				'edit-site/global-styles' !==
					getActiveComplementaryArea( 'core' ) ||
				! _isVisualEditorMode,
			showListViewByDefault: _showListViewByDefault,
			hasRevisions:
				!! globalStyles?._links?.[ 'version-history' ]?.[ 0 ]?.count,
			activeComplementaryArea: getActiveComplementaryArea( 'core' ),
			editorSettings: getEditorSettings(),
			styleStateViewport: unlock(
				select( blockEditorStore )
			).getStyleStateViewport(),
			isDistractionFree: _isDistractionFree,
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

	// Reset navigation when sidebar opens
	useEffect( () => {
		if (
			activeComplementaryArea === 'edit-site/global-styles' &&
			previousActiveArea !== 'edit-site/global-styles'
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
			<PluginSidebar
				name="global-styles"
				identifier="edit-site/global-styles"
				title={ __( 'Styles' ) }
				icon={ styles }
				isPinnable={ ! isDistractionFree }
				closeLabel={ __( 'Close Styles' ) }
				className="editor-global-styles-sidebar__panel"
				// The sidebar is a flex column so the panel can fill the
				// remaining height.
				render={ <div className="editor-global-styles-sidebar" /> }
				header={
					<Stack
						className="editor-global-styles-sidebar__header"
						direction="row"
						align="center"
						gap="xs"
					>
						<h2 className="editor-global-styles-sidebar__header-title">
							{ __( 'Styles' ) }
						</h2>
						<Stack
							className="editor-global-styles-sidebar__header-actions"
							direction="row"
							align="center"
							justify="flex-end"
							gap="xs"
						>
							{ ! isMobileViewport && (
								<Button
									icon={ seen }
									label={ __( 'Style Book' ) }
									isPressed={ showStylebook }
									accessibleWhenDisabled
									disabled={ shouldResetNavigation }
									onClick={ toggleStyleBook }
									size="compact"
								/>
							) }
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
							<GlobalStylesActionMenu
								onChangePath={ setStylesPath }
							/>
						</Stack>
					</Stack>
				}
			>
				<GlobalStylesUI
					path={ stylesPath }
					onPathChange={ setStylesPath }
					settings={ editorSettings }
					selectedViewport={ styleStateViewport }
					showResponsiveStateControls={ false }
				/>
			</PluginSidebar>
			<WelcomeGuideStyles />
		</>
	);
}
