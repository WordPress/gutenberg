import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { useViewportMatch } from '@wordpress/compose';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { Button, __experimentalHStack as HStack } from '@wordpress/components';
import { addQueryArgs, removeQueryArgs } from '@wordpress/url';
import { seen } from '@wordpress/icons';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as editSiteStore } from '../../store';
import { STYLE_BOOK_PREFERENCE, shouldShowStyleBook } from './utils';
import { unlock } from '../../lock-unlock';

const { GlobalStylesUIWrapper, GlobalStylesActionMenu } =
	unlock( editorPrivateApis );
const { useLocation, useHistory } = unlock( routerPrivateApis );
const { ToolsPanelPopoverPropsContext } = unlock( blockEditorPrivateApis );

// Panel padding (16px) + screen padding (12px) + spacing (4px)
const TOOLS_PANEL_POPOVER_PROPS = {
	dropdown: { placement: 'right-start', offset: 32 },
	item: { placement: 'right-start', offset: 32, shift: true },
};

/**
 * Returns the saved Style Book preference, if the user has set one.
 *
 * @return {boolean|undefined} The preference.
 */
const useStyleBookPreference = () =>
	useSelect(
		( select ) =>
			select( preferencesStore ).get(
				'core/edit-site',
				STYLE_BOOK_PREFERENCE
			),
		[]
	);

/**
 * Whether Styles shows the Style Book. `preview=stylebook` in the URL shows
 * it; otherwise the section and the user's preference decide.
 *
 * @return {boolean} Whether the Style Book is shown.
 */
export const useIsStyleBookOpened = () => {
	const { query } = useLocation();
	const preference = useStyleBookPreference();
	return (
		query.preview === 'stylebook' ||
		shouldShowStyleBook( query.section ?? '/', preference )
	);
};

const GlobalStylesPageActions = ( {
	isStyleBookOpened,
	path,
	onChangeSection,
} ) => {
	const history = useHistory();
	const { set: setPreference } = useDispatch( preferencesStore );

	return (
		<HStack className="edit-site-styles__header-actions">
			<Button
				isPressed={ isStyleBookOpened }
				icon={ seen }
				label={ __( 'Style Book' ) }
				onClick={ () => {
					// Remember the choice, so every section and later visits
					// follow it.
					setPreference(
						'core/edit-site',
						STYLE_BOOK_PREFERENCE,
						! isStyleBookOpened
					);
					history.navigate(
						! isStyleBookOpened
							? addQueryArgs( path, { preview: 'stylebook' } )
							: removeQueryArgs( path, 'preview' )
					);
				} }
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
	const preference = useStyleBookPreference();
	return useMemo( () => {
		return [
			query.section ?? '/',
			( updatedSection ) => {
				// Each section follows the preference, so a Style Book turned
				// on for Revisions or Additional CSS doesn't carry over.
				history.navigate(
					addQueryArgs( removeQueryArgs( path, 'preview' ), {
						section: updatedSection,
						...( shouldShowStyleBook(
							updatedSection,
							preference
						) && {
							preview: 'stylebook',
						} ),
					} )
				);
			},
		];
	}, [ path, query.section, history, preference ] );
};

export default function SidebarGlobalStyles() {
	const { path } = useLocation();
	const isStyleBookOpened = useIsStyleBookOpened();
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
