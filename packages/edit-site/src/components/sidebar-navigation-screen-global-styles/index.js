/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { edit, seen } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __experimentalNavigatorButton as NavigatorButton } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import StyleVariationsContainer from '../global-styles/style-variations-container';
import { unlock } from '../../private-apis';
import { store as editSiteStore } from '../../store';
import SidebarButton from '../sidebar-button';
import SidebarNavigationItem from '../sidebar-navigation-item';
import StyleBook from '../style-book';

export function SidebarNavigationItemGlobalStyles( props ) {
	const { openGeneralSidebar } = useDispatch( editSiteStore );
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
	const hasGlobalStyleVariations = useSelect(
		( select ) =>
			!! select(
				coreStore
			).__experimentalGetCurrentThemeGlobalStylesVariations()?.length,
		[]
	);
	if ( hasGlobalStyleVariations ) {
		return (
			<NavigatorButton
				{ ...props }
				as={ SidebarNavigationItem }
				path="/wp_global_styles"
			/>
		);
	}
	return (
		<SidebarNavigationItem
			{ ...props }
			onClick={ () => {
				// switch to edit mode.
				setCanvasMode( 'edit' );
				// open global styles sidebar.
				openGeneralSidebar( 'edit-site/global-styles' );
			} }
		/>
	);
}

export default function SidebarNavigationScreenGlobalStyles() {
	const { openGeneralSidebar } = useDispatch( editSiteStore );
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const { setCanvasMode, setEditorCanvasContainerView } = unlock(
		useDispatch( editSiteStore )
	);

	const isStyleBookOpened = useSelect(
		( select ) =>
			'style-book' ===
			unlock( select( editSiteStore ) ).getEditorCanvasContainerView(),
		[]
	);

	const openGlobalStyles = async () =>
		Promise.all( [
			setCanvasMode( 'edit' ),
			openGeneralSidebar( 'edit-site/global-styles' ),
		] );

	const openStyleBook = async () => {
		await openGlobalStyles();
		// Open the Style Book once the canvas mode is set to edit,
		// and the global styles sidebar is open. This ensures that
		// the Style Book is not prematurely closed.
		setEditorCanvasContainerView( 'style-book' );
	};

	return (
		<>
			<SidebarNavigationScreen
				title={ __( 'Styles' ) }
				description={ __(
					'Choose a different style combination for the theme styles.'
				) }
				content={ <StyleVariationsContainer /> }
				actions={
					<div>
						{ ! isMobileViewport && (
							<SidebarButton
								icon={ seen }
								label={ __( 'Style Book' ) }
								onClick={ () =>
									setEditorCanvasContainerView(
										! isStyleBookOpened
											? 'style-book'
											: undefined
									)
								}
								isPressed={ isStyleBookOpened }
							/>
						) }
						<SidebarButton
							icon={ edit }
							label={ __( 'Edit styles' ) }
							onClick={ async () => await openGlobalStyles() }
						/>
					</div>
				}
			/>
			{ isStyleBookOpened && ! isMobileViewport && (
				<StyleBook
					enableResizing={ false }
					isSelected={ () => false }
					onClick={ openStyleBook }
					onSelect={ openStyleBook }
					showCloseButton={ false }
					showTabs={ false }
				/>
			) }
		</>
	);
}
