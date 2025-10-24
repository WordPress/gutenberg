/**
 * WordPress dependencies
 */
import { FlexItem, Flex, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { styles, seen, backup } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef, useState } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	store as editorStore,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';
import { useViewportMatch, usePrevious } from '@wordpress/compose';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import GlobalStylesUI from '../global-styles';
import { GlobalStylesActionMenu } from '../global-styles/menu';
import { store as editSiteStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { store as coreStore } from '@wordpress/core-data';
import DefaultSidebar from './default-sidebar';

const { interfaceStore } = unlock( editorPrivateApis );
const { useLocation } = unlock( routerPrivateApis );

export default function GlobalStylesSidebar() {
	const { query } = useLocation();
	const { canvas = 'view', name } = query;
	const {
		shouldClearCanvasContainerView,
		isStyleBookOpened,
		showListViewByDefault,
		hasRevisions,
		isRevisionsOpened,
		isRevisionsStyleBookOpened,
		activeComplementaryArea,
	} = useSelect(
		( select ) => {
			const { getActiveComplementaryArea } = select( interfaceStore );
			const { getEditorCanvasContainerView } = unlock(
				select( editSiteStore )
			);
			const canvasContainerView = getEditorCanvasContainerView();
			const _isVisualEditorMode =
				'visual' === select( editorStore ).getEditorMode();
			const _isEditCanvasMode = 'edit' === canvas;
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
				isStyleBookOpened: 'style-book' === canvasContainerView,
				shouldClearCanvasContainerView:
					'edit-site/global-styles' !==
						getActiveComplementaryArea( 'core' ) ||
					! _isVisualEditorMode ||
					! _isEditCanvasMode,
				showListViewByDefault: _showListViewByDefault,
				hasRevisions:
					!! globalStyles?._links?.[ 'version-history' ]?.[ 0 ]
						?.count,
				isRevisionsStyleBookOpened:
					'global-styles-revisions:style-book' ===
					canvasContainerView,
				isRevisionsOpened:
					'global-styles-revisions' === canvasContainerView,
				activeComplementaryArea:
					select( interfaceStore ).getActiveComplementaryArea(
						'core'
					),
			};
		},
		[ canvas ]
	);
	const { setEditorCanvasContainerView } = unlock(
		useDispatch( editSiteStore )
	);
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const [ globalStylesPath, setGlobalStylesPath ] = useState( '/' );
	const previousActiveArea = usePrevious( activeComplementaryArea );

	// Reset path when sidebar opens
	useEffect( () => {
		if (
			activeComplementaryArea === 'edit-site/global-styles' &&
			previousActiveArea !== 'edit-site/global-styles'
		) {
			setGlobalStylesPath( '/' );
		}
	}, [ activeComplementaryArea, previousActiveArea, setGlobalStylesPath ] );

	useEffect( () => {
		if ( shouldClearCanvasContainerView ) {
			setEditorCanvasContainerView( undefined );
		}
	}, [ shouldClearCanvasContainerView, setEditorCanvasContainerView ] );

	const { setIsListViewOpened } = useDispatch( editorStore );

	const toggleRevisions = () => {
		setIsListViewOpened( false );
		if ( isRevisionsStyleBookOpened ) {
			setEditorCanvasContainerView( 'style-book' );
			return;
		}
		if ( isRevisionsOpened ) {
			setEditorCanvasContainerView( undefined );
			return;
		}

		if ( isStyleBookOpened ) {
			setEditorCanvasContainerView(
				'global-styles-revisions:style-book'
			);
		} else {
			setEditorCanvasContainerView( 'global-styles-revisions' );
		}
	};
	const toggleStyleBook = () => {
		if ( isRevisionsOpened ) {
			setEditorCanvasContainerView(
				'global-styles-revisions:style-book'
			);
			return;
		}
		if ( isRevisionsStyleBookOpened ) {
			setEditorCanvasContainerView( 'global-styles-revisions' );
			return;
		}
		setIsListViewOpened( isStyleBookOpened && showListViewByDefault );
		setEditorCanvasContainerView(
			isStyleBookOpened ? undefined : 'style-book'
		);
	};

	const { getActiveComplementaryArea } = useSelect( interfaceStore );
	const { enableComplementaryArea } = useDispatch( interfaceStore );
	const previousActiveAreaRef = useRef( null );

	useEffect( () => {
		if ( name === 'styles' && canvas === 'edit' ) {
			previousActiveAreaRef.current =
				getActiveComplementaryArea( 'core' );
			enableComplementaryArea( 'core', 'edit-site/global-styles' );
		} else if ( previousActiveAreaRef.current ) {
			enableComplementaryArea( 'core', previousActiveAreaRef.current );
		}
	}, [ name, enableComplementaryArea, canvas, getActiveComplementaryArea ] );

	return (
		<DefaultSidebar
			className="edit-site-global-styles-sidebar"
			identifier="edit-site/global-styles"
			title={ __( 'Styles' ) }
			icon={ styles }
			closeLabel={ __( 'Close Styles' ) }
			panelClassName="edit-site-global-styles-sidebar__panel"
			header={
				<Flex
					className="edit-site-global-styles-sidebar__header"
					gap={ 1 }
				>
					<FlexItem>
						<h2 className="edit-site-global-styles-sidebar__header-title">
							{ __( 'Styles' ) }
						</h2>
					</FlexItem>
					<Flex
						justify="flex-end"
						gap={ 1 }
						className="edit-site-global-styles-sidebar__header-actions"
					>
						{ ! isMobileViewport && (
							<FlexItem>
								<Button
									icon={ seen }
									label={ __( 'Style Book' ) }
									isPressed={
										isStyleBookOpened ||
										isRevisionsStyleBookOpened
									}
									accessibleWhenDisabled
									disabled={ shouldClearCanvasContainerView }
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
						<GlobalStylesActionMenu />
					</Flex>
				</Flex>
			}
		>
			<GlobalStylesUI
				path={ globalStylesPath }
				onPathChange={ setGlobalStylesPath }
			/>
		</DefaultSidebar>
	);
}
