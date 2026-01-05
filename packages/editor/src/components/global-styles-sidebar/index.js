/**
 * WordPress dependencies
 */
import { FlexItem, Flex, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { styles, seen, backup } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';
import { useViewportMatch, usePrevious } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import GlobalStylesUI from '../global-styles';
import { GlobalStylesActionMenu } from '../global-styles/menu';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import DefaultSidebar from './default-sidebar';
import WelcomeGuideStyles from './welcome-guide';

export default function GlobalStylesSidebar() {
	const {
		shouldResetNavigation,
		stylesPath,
		showStylebook,
		showListViewByDefault,
		hasRevisions,
		activeComplementaryArea,
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
				'edit-site/global-styles' !==
					getActiveComplementaryArea( 'core' ) ||
				! _isVisualEditorMode,
			showListViewByDefault: _showListViewByDefault,
			hasRevisions:
				!! globalStyles?._links?.[ 'version-history' ]?.[ 0 ]?.count,
			activeComplementaryArea:
				select( interfaceStore ).getActiveComplementaryArea( 'core' ),
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
			<DefaultSidebar
				className="editor-global-styles-sidebar"
				identifier="edit-site/global-styles"
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
				/>
			</DefaultSidebar>
			<WelcomeGuideStyles />
		</>
	);
}
