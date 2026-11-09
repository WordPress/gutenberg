import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { useViewportMatch } from '@wordpress/compose';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { Button, __experimentalHStack as HStack } from '@wordpress/components';
import { addQueryArgs, removeQueryArgs } from '@wordpress/url';
import { seen, backup } from '@wordpress/icons';
import { useGlobalStylesRevisions } from '@wordpress/global-styles-ui';
import { store as editSiteStore } from '../../store';
import { unlock } from '../../lock-unlock';
import useOpenGlobalStylesRevisions from '../sidebar-navigation-screen-global-styles/use-open-global-styles-revisions';

const { GlobalStylesUIWrapper, GlobalStylesActionMenu } =
	unlock( editorPrivateApis );
const { useLocation, useHistory } = unlock( routerPrivateApis );
const { ToolsPanelPopoverPropsContext } = unlock( blockEditorPrivateApis );

// Panel padding (16px) + screen padding (12px) + spacing (4px)
const TOOLS_PANEL_POPOVER_PROPS = {
	dropdown: { placement: 'right-start', offset: 32 },
	item: { placement: 'right-start', offset: 32, shift: true },
};

const GlobalStylesPageActions = ( {
	isStyleBookOpened,
	setIsStyleBookOpened,
	path,
	onChangeSection,
} ) => {
	const history = useHistory();
	const { revisionsCount, isLoading: isLoadingRevisions } =
		useGlobalStylesRevisions();
	const { openRevisions } = useOpenGlobalStylesRevisions();

	return (
		<HStack className="edit-site-styles__header-actions">
			<Button
				isPressed={ isStyleBookOpened }
				icon={ seen }
				label={ __( 'Style Book' ) }
				onClick={ () => {
					setIsStyleBookOpened( ! isStyleBookOpened );
					const updatedPath = ! isStyleBookOpened
						? addQueryArgs( path, { preview: 'stylebook' } )
						: removeQueryArgs( path, 'preview' );
					// Navigate to the updated path.
					history.navigate( updatedPath );
				} }
				size="compact"
			/>
			<Button
				icon={ backup }
				label={ __( 'Revisions' ) }
				onClick={ openRevisions }
				accessibleWhenDisabled
				disabled={ isLoadingRevisions || ! revisionsCount }
				size="compact"
			/>
			<GlobalStylesActionMenu
				hideWelcomeGuide
				onChangePath={ onChangeSection }
			/>
		</HStack>
	);
};

/**
 * Hook to deal with navigation and location state.
 *
 * @return {Array}  The current section and a function to update it.
 */
export const useSection = () => {
	const { path, query } = useLocation();
	const history = useHistory();
	return useMemo( () => {
		return [
			query.section ?? '/',
			( updatedSection ) => {
				history.navigate(
					addQueryArgs( path, {
						section: updatedSection,
					} )
				);
			},
		];
	}, [ path, query.section, history ] );
};

export default function SidebarGlobalStyles() {
	const { path } = useLocation();

	const [ isStyleBookOpened, setIsStyleBookOpened ] = useState(
		path.includes( 'preview=stylebook' )
	);
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const [ section, onChangeSection ] = useSection();
	const settings = useSelect(
		( select ) => select( editSiteStore ).getSettings(),
		[]
	);

	return (
		<Page
			actions={
				! isMobileViewport ? (
					<GlobalStylesPageActions
						isStyleBookOpened={ isStyleBookOpened }
						setIsStyleBookOpened={ setIsStyleBookOpened }
						path={ path }
						onChangeSection={ onChangeSection }
					/>
				) : null
			}
			className="edit-site-styles"
			title={ __( 'Styles' ) }
			headingLevel={ 2 }
		>
			<div className="edit-site-styles__content">
				<ToolsPanelPopoverPropsContext.Provider
					value={ TOOLS_PANEL_POPOVER_PROPS }
				>
					<GlobalStylesUIWrapper
						path={ section }
						onPathChange={ onChangeSection }
						settings={ settings }
					/>
				</ToolsPanelPopoverPropsContext.Provider>
			</div>
		</Page>
	);
}
