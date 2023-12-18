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
import { store as interfaceStore } from '@wordpress/interface';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import DefaultSidebar from './default-sidebar';
import { GlobalStylesUI } from '../global-styles';
import { store as editSiteStore } from '../../store';
import { GlobalStylesMenuSlot } from '../global-styles/ui';
import { unlock } from '../../lock-unlock';
import { store as coreStore } from '@wordpress/core-data';

export default function GlobalStylesSidebar() {
	const {
		shouldClearCanvasContainerView,
		isStyleBookOpened,
		showListViewByDefault,
		hasRevisions,
		isRevisionsOpened,
	} = useSelect( ( select ) => {
		const { getActiveComplementaryArea } = select( interfaceStore );
		const { getEditorCanvasContainerView, getCanvasMode } = unlock(
			select( editSiteStore )
		);
		const canvasContainerView = getEditorCanvasContainerView();
		const _isVisualEditorMode =
			'visual' === select( editSiteStore ).getEditorMode();
		const _isEditCanvasMode = 'edit' === getCanvasMode();
		const _showListViewByDefault = select( preferencesStore ).get(
			'core/edit-site',
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
					getActiveComplementaryArea( 'core/edit-site' ) ||
				! _isVisualEditorMode ||
				! _isEditCanvasMode,
			showListViewByDefault: _showListViewByDefault,
			hasRevisions:
				!! globalStyles?._links?.[ 'version-history' ]?.[ 0 ]?.count,
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
	const loadRevisions = () => {
		setIsListViewOpened( false );

		if ( ! isRevisionsOpened ) {
			goTo( '/revisions' );
			setEditorCanvasContainerView( 'global-styles-revisions' );
		} else {
			goTo( '/' );
			setEditorCanvasContainerView( undefined );
		}
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
				<Flex
					className="edit-site-global-styles-sidebar__header"
					role="menubar"
					aria-label={ __( 'Styles actions' ) }
				>
					<FlexBlock style={ { minWidth: 'min-content' } }>
						<strong>{ __( 'Styles' ) }</strong>
					</FlexBlock>
					<FlexItem>
						<Button
							icon={ seen }
							label={ __( 'Style Book' ) }
							isPressed={ isStyleBookOpened }
							disabled={ shouldClearCanvasContainerView }
							onClick={ () => {
								setIsListViewOpened(
									isStyleBookOpened && showListViewByDefault
								);
								setEditorCanvasContainerView(
									isStyleBookOpened ? undefined : 'style-book'
								);
							} }
						/>
					</FlexItem>
					<FlexItem>
						<Button
							label={ __( 'Revisions' ) }
							icon={ backup }
							onClick={ loadRevisions }
							disabled={ ! hasRevisions }
							isPressed={ isRevisionsOpened }
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
