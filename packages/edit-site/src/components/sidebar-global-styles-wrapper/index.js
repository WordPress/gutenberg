/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useMemo, useState } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useViewportMatch } from '@wordpress/compose';
import {
	Button,
	__experimentalHStack as HStack,
	DropdownMenu,
	MenuGroup,
	MenuItem,
} from '@wordpress/components';
import { addQueryArgs, removeQueryArgs } from '@wordpress/url';
import { seen, moreVertical } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import GlobalStylesUI from '../global-styles/ui';
import { unlock } from '../../lock-unlock';

const { useLocation, useHistory } = unlock( routerPrivateApis );

const GlobalStylesPageActions = ( {
	isStyleBookOpened,
	setIsStyleBookOpened,
	path,
} ) => {
	const history = useHistory();
	const canEditCSS = useSelect( ( select ) => {
		const { getEntityRecord, __experimentalGetCurrentGlobalStylesId } =
			select( coreStore );
		const globalStylesId = __experimentalGetCurrentGlobalStylesId();
		const globalStyles = globalStylesId
			? getEntityRecord( 'root', 'globalStyles', globalStylesId )
			: undefined;
		return !! globalStyles?._links?.[ 'wp:action-edit-css' ];
	}, [] );

	return (
		<HStack>
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
			{ canEditCSS && (
				<DropdownMenu
					icon={ moreVertical }
					label={ __( 'More' ) }
					toggleProps={ { size: 'compact' } }
				>
					{ ( { onClose } ) => (
						<MenuGroup>
							{ canEditCSS && (
								<MenuItem
									onClick={ () => {
										onClose();
										history.navigate(
											addQueryArgs( path, {
												section: '/css',
											} )
										);
									} }
								>
									{ __( 'Additional CSS' ) }
								</MenuItem>
							) }
						</MenuGroup>
					) }
				</DropdownMenu>
			) }
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

export default function GlobalStylesUIWrapper() {
	const { path } = useLocation();

	const [ isStyleBookOpened, setIsStyleBookOpened ] = useState(
		path.includes( 'preview=stylebook' )
	);
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const [ section, onChangeSection ] = useSection();

	return (
		<Page
			actions={
				! isMobileViewport ? (
					<GlobalStylesPageActions
						isStyleBookOpened={ isStyleBookOpened }
						setIsStyleBookOpened={ setIsStyleBookOpened }
						path={ path }
					/>
				) : null
			}
			className="edit-site-styles"
			title={ __( 'Styles' ) }
		>
			<GlobalStylesUI path={ section } onPathChange={ onChangeSection } />
		</Page>
	);
}
