/**
 * WordPress dependencies
 */
import {
	FlexItem,
	FlexBlock,
	Flex,
	Button,
	__experimentalUseNavigator as useNavigator,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { styles, seen, backup } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	store as editorStore,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import DefaultSidebar from './default-sidebar';
import { GlobalStylesUI } from '../global-styles';
import { store as editSiteStore } from '../../store';
import { GlobalStylesMenuSlot } from '../global-styles/ui';
import { unlock } from '../../lock-unlock';
import { store as coreStore } from '@wordpress/core-data';

const { interfaceStore } = unlock( editorPrivateApis );

export default function GlobalStylesSidebar() {
	const {
		shouldClearCanvasContainerView,
		isStyleBookOpened,
		showListViewByDefault,
		hasRevisions,
		isRevisionsOpened,
		isRevisionsStyleBookOpened,
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

		return {
			isStyleBookOpened: 'style-book' === canvasContainerView,
			shouldClearCanvasContainerView:
				'edit-site/global-styles' !==
					getActiveComplementaryArea( 'core' ) ||
				! _isVisualEditorMode ||
				! _isEditCanvasMode,
			showListViewByDefault: _showListViewByDefault,
			hasRevisions:
				!! globalStyles?._links?.[ 'version-history' ]?.[ 0 ]?.count,
			isRevisionsStyleBookOpened:
				'global-styles-revisions:style-book' === canvasContainerView,
			isRevisionsOpened:
				'global-styles-revisions' === canvasContainerView,
		};
	}, [] );
	const { setEditorCanvasContainerView } = unlock(
		useDispatch( editSiteStore )
	);

	useEffect( () => {
		if ( shouldClearCanvasContainerView ) {
			setEditorCanvasContainerView( undefined );
		}
	}, [ shouldClearCanvasContainerView ] );

	const { setIsListViewOpened } = useDispatch( editorStore );
	const { goTo } = useNavigator();

	const toggleRevisions = () => {
		setIsListViewOpened( false );
		if ( isRevisionsStyleBookOpened ) {
			goTo( '/' );
			setEditorCanvasContainerView( 'style-book' );
			return;
		}
		if ( isRevisionsOpened ) {
			goTo( '/' );
			setEditorCanvasContainerView( undefined );
			return;
		}
		goTo( '/revisions' );

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
			header={
				<Flex className="edit-site-global-styles-sidebar__header">
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
							disabled={ shouldClearCanvasContainerView }
							onClick={ toggleStyleBook }
						/>
					</FlexItem>
					<FlexItem>
						<Button
							label={ __( 'Revisions' ) }
							icon={ backup }
							onClick={ toggleRevisions }
							disabled={ ! hasRevisions }
							isPressed={
								isRevisionsOpened || isRevisionsStyleBookOpened
							}
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
