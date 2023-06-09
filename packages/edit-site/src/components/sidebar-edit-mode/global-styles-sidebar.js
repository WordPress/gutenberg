/**
 * WordPress dependencies
 */
import { FlexItem, FlexBlock, Flex, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { styles, seen } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import DefaultSidebar from './default-sidebar';
import { GlobalStylesUI } from '../global-styles';
import { store as editSiteStore } from '../../store';
import { GlobalStylesMenuSlot } from '../global-styles/ui';
import { unlock } from '../../lock-unlock';

export default function GlobalStylesSidebar() {
	const { shouldClearCanvasContainerView, isStyleBookOpened } = useSelect(
		( select ) => {
			const { getActiveComplementaryArea } = select( interfaceStore );
			const { getEditorCanvasContainerView, getCanvasMode } = unlock(
				select( editSiteStore )
			);
			const _isVisualEditorMode =
				'visual' === select( editSiteStore ).getEditorMode();
			const _isEditCanvasMode = 'edit' === getCanvasMode();

			return {
				isStyleBookOpened:
					'style-book' === getEditorCanvasContainerView(),
				shouldClearCanvasContainerView:
					'edit-site/global-styles' !==
						getActiveComplementaryArea( 'core/edit-site' ) ||
					! _isVisualEditorMode ||
					! _isEditCanvasMode,
			};
		},
		[]
	);
	const { setEditorCanvasContainerView } = unlock(
		useDispatch( editSiteStore )
	);

	useEffect( () => {
		if ( shouldClearCanvasContainerView ) {
			setEditorCanvasContainerView( undefined );
		}
	}, [ shouldClearCanvasContainerView ] );

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
						<strong>{ __( 'Styles' ) }</strong>
					</FlexBlock>
					<FlexItem>
						<Button
							icon={ seen }
							label={ __( 'Style Book' ) }
							isPressed={ isStyleBookOpened }
							disabled={ shouldClearCanvasContainerView }
							onClick={ () =>
								setEditorCanvasContainerView(
									isStyleBookOpened ? undefined : 'style-book'
								)
							}
						/>
					</FlexItem>
					<FlexItem>
						<GlobalStylesMenuSlot />
					</FlexItem>
				</Flex>
			}
		>
			<GlobalStylesUI />
		</DefaultSidebar>
	);
}
