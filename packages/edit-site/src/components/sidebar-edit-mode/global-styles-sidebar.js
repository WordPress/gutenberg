/**
 * WordPress dependencies
 */
import { FlexItem, FlexBlock, Flex, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { styles, seen } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { store as interfaceStore } from '@wordpress/interface';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import DefaultSidebar from './default-sidebar';
import { GlobalStylesUI } from '../global-styles';
import { store as editSiteStore } from '../../store';
import { GlobalStylesMenuSlot } from '../global-styles/ui';
import { unlock } from '../../lock-unlock';

export default function GlobalStylesSidebar() {
	const {
		shouldClearCanvasContainerView,
		isStyleBookOpened,
		showListViewByDefault,
	} = useSelect( ( select ) => {
		const { getActiveComplementaryArea } = select( interfaceStore );
		const { getEditorCanvasContainerView, getCanvasMode } = unlock(
			select( editSiteStore )
		);
		const _isVisualEditorMode =
			'visual' === select( editSiteStore ).getEditorMode();
		const _isEditCanvasMode = 'edit' === getCanvasMode();
		const _showListViewByDefault = select( preferencesStore ).get(
			'core/edit-site',
			'showListViewByDefault'
		);

		return {
			isStyleBookOpened: 'style-book' === getEditorCanvasContainerView(),
			shouldClearCanvasContainerView:
				'edit-site/global-styles' !==
					getActiveComplementaryArea( 'core/edit-site' ) ||
				! _isVisualEditorMode ||
				! _isEditCanvasMode,
			showListViewByDefault: _showListViewByDefault,
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

	const { setIsListViewOpened } = useDispatch( editSiteStore );

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
					<GlobalStylesMenuSlot />
				</Flex>
			}
		>
			<GlobalStylesUI />
		</DefaultSidebar>
	);
}
