/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { useViewportMatch } from '@wordpress/compose';
import { Button, __experimentalHStack as HStack } from '@wordpress/components';
import { addQueryArgs, removeQueryArgs } from '@wordpress/url';
import { seen } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const {
	GlobalStylesUIWrapper,
	GlobalStylesActionMenu,
	StyleVariationSelector,
	useStyleVariations,
} = unlock( editorPrivateApis );
const { useLocation, useHistory } = unlock( routerPrivateApis );

const GlobalStylesPageActions = ( {
	isStyleBookOpened,
	setIsStyleBookOpened,
	path,
	onChangeSection,
	selectedStyleVariation,
	onSelectStyleVariation,
} ) => {
	const history = useHistory();

	const openStyleBook = () => {
		if ( ! isStyleBookOpened ) {
			setIsStyleBookOpened( true );
			const updatedPath = addQueryArgs( path, { preview: 'stylebook' } );
			history.navigate( updatedPath );
		}
	};

	return (
		<HStack>
			<StyleVariationSelector
				selectedStyleVariation={ selectedStyleVariation }
				onSelect={ onSelectStyleVariation }
				onOpenStyleBook={ openStyleBook }
			/>
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
	const [ selectedStyleVariation, setSelectedStyleVariation ] = useState( 0 );
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const [ section, onChangeSection ] = useSection();

	// Get style variations for showing info paragraph.
	const { styleVariations } = useStyleVariations();

	// Find the selected style variation info.
	const selectedStyleVariationInfo =
		selectedStyleVariation !== 0
			? styleVariations.find(
					( variation ) => variation.id === selectedStyleVariation
			  )
			: null;

	return (
		<Page
			actions={
				! isMobileViewport ? (
					<GlobalStylesPageActions
						isStyleBookOpened={ isStyleBookOpened }
						setIsStyleBookOpened={ setIsStyleBookOpened }
						path={ path }
						onChangeSection={ onChangeSection }
						selectedStyleVariation={ selectedStyleVariation }
						onSelectStyleVariation={ setSelectedStyleVariation }
					/>
				) : null
			}
			className="edit-site-styles"
			title={ __( 'Styles' ) }
		>
			{ selectedStyleVariationInfo && (
				<p className="edit-site-styles__style-variation-info">
					{ `Editing "${ selectedStyleVariationInfo.title }" style variation. Changes apply only when this style is connected to a post, page, template, or pattern.` }
				</p>
			) }
			<GlobalStylesUIWrapper
				path={ section }
				onPathChange={ onChangeSection }
				styleVariationId={ selectedStyleVariation }
			/>
		</Page>
	);
}
