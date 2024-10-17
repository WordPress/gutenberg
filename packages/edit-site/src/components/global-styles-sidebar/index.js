/**
 * WordPress dependencies
 */
import { FlexItem, FlexBlock, Flex, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { styles, seen, backup } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	store as editorStore,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { GlobalStylesUI } from '../global-styles';
import { store as editSiteStore } from '../../store';
import { GlobalStylesMenuSlot } from '../global-styles/ui';
import { unlock } from '../../lock-unlock';
import { store as coreStore } from '@wordpress/core-data';
import DefaultSidebar from './default-sidebar';

const { interfaceStore } = unlock( editorPrivateApis );
const { useLocation } = unlock( routerPrivateApis );

export default function GlobalStylesSidebar() {
	const {
		shouldClearCanvasContainerView,
		isStyleBookOpened,
		showListViewByDefault,
		hasRevisions,
		isRevisionsOpened,
		isRevisionsStyleBookOpened,
		isGlobalStylesOpen,
	} = useSelect( ( select ) => {
		const { getActiveComplementaryArea } = select( interfaceStore );
		const { getEditorCanvasContainerView, getCanvasMode } = unlock(
			select( editSiteStore )
		);
		const canvasContainerView = getEditorCanvasContainerView();
		const _isVisualEditorMode =
			'visual' === select( editorStore ).getEditorMode();
		const _isEditCanvasMode = 'edit' === getCanvasMode();
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
		const _isGlobalStylesOpen =
			_isEditCanvasMode &&
			'edit-site/global-styles' === getActiveComplementaryArea( 'core' );

		return {
			isStyleBookOpened: 'style-book' === canvasContainerView,
			shouldClearCanvasContainerView:
				! _isGlobalStylesOpen ||
				! _isVisualEditorMode ||
				! _isEditCanvasMode,
			showListViewByDefault: _showListViewByDefault,
			hasRevisions:
				!! globalStyles?._links?.[ 'version-history' ]?.[ 0 ]?.count,
			isRevisionsStyleBookOpened:
				'global-styles-revisions:style-book' === canvasContainerView,
			isRevisionsOpened:
				'global-styles-revisions' === canvasContainerView,
			isGlobalStylesOpen: _isGlobalStylesOpen,
		};
	}, [] );
	const { setEditorCanvasContainerView } = unlock(
		useDispatch( editSiteStore )
	);
	const { params } = useLocation();

	useEffect( () => {
/*		if (
			isGlobalStylesOpen &&
			params.path === '/wp_global_styles/style-book'
		) {
			setEditorCanvasContainerView( 'style-book' );
			return;
		}*/
		if ( shouldClearCanvasContainerView ) {
			setEditorCanvasContainerView( undefined );
		}
	}, [ shouldClearCanvasContainerView ] );

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

	return (
		<DefaultSidebar
			className="edit-site-global-styles-sidebar"
			identifier="edit-site/global-styles"
			title={ __( 'Styles' ) }
			icon={ styles }
			closeLabel={ __( 'Close Styles' ) }
			panelClassName="edit-site-global-styles-sidebar__panel"
			isActiveByDefault={ params?.path.startsWith( '/wp_global_styles' ) }
			header={
				<Flex
					className="edit-site-global-styles-sidebar__header"
					gap={ 1 }
				>
					<FlexBlock style={ { minWidth: 'min-content' } }>
						<h2 className="edit-site-global-styles-sidebar__header-title">
							{ __( 'Styles' ) }
						</h2>
					</FlexBlock>
					<FlexItem>
						<Button
							icon={ seen }
							label={ __( 'Style Book' ) }
							isPressed={
								isStyleBookOpened || isRevisionsStyleBookOpened
							}
							accessibleWhenDisabled
							disabled={ shouldClearCanvasContainerView }
							onClick={ toggleStyleBook }
							size="compact"
						/>
					</FlexItem>
					<FlexItem>
						<Button
							label={ __( 'Revisions' ) }
							icon={ backup }
							onClick={ toggleRevisions }
							accessibleWhenDisabled
							disabled={ ! hasRevisions }
							isPressed={
								isRevisionsOpened || isRevisionsStyleBookOpened
							}
							size="compact"
						/>
					</FlexItem>
					<GlobalStylesMenuSlot />
				</Flex>
			}
		>
			<GlobalStylesUI />
		</DefaultSidebar>
	);
}
