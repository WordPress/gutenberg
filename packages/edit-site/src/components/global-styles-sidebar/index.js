/**
 * WordPress dependencies
 */
import { FlexItem, Flex, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { styles, seen } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	store as editorStore,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';
import { useViewportMatch } from '@wordpress/compose';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { GlobalStylesUI } from '../global-styles';
import { store as editSiteStore } from '../../store';
import { GlobalStylesMenuSlot } from '../global-styles/ui';
import { unlock } from '../../lock-unlock';
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
		isRevisionsOpened,
		isRevisionsStyleBookOpened,
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

			return {
				isStyleBookOpened: 'style-book' === canvasContainerView,
				shouldClearCanvasContainerView:
					'edit-site/global-styles' !==
						getActiveComplementaryArea( 'core' ) ||
					! _isVisualEditorMode ||
					! _isEditCanvasMode,
				showListViewByDefault: _showListViewByDefault,
				isRevisionsStyleBookOpened:
					'global-styles-revisions:style-book' ===
					canvasContainerView,
				isRevisionsOpened:
					'global-styles-revisions' === canvasContainerView,
			};
		},
		[ canvas ]
	);
	const { setEditorCanvasContainerView } = unlock(
		useDispatch( editSiteStore )
	);
	const isMobileViewport = useViewportMatch( 'medium', '<' );

	useEffect( () => {
		if ( shouldClearCanvasContainerView ) {
			setEditorCanvasContainerView( undefined );
		}
	}, [ shouldClearCanvasContainerView, setEditorCanvasContainerView ] );

	const { setIsListViewOpened } = useDispatch( editorStore );

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
						<GlobalStylesMenuSlot />
					</Flex>
				</Flex>
			}
		>
			<GlobalStylesUI />
		</DefaultSidebar>
	);
}
