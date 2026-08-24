import { useNavigate, useSearch } from '@wordpress/route';
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { useViewportMatch } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	Button,
	Modal,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { decodeEntities } from '@wordpress/html-entities';
import { seen } from '@wordpress/icons';
import { useState } from '@wordpress/element';
import { useEditorSettings } from '@wordpress/lazy-editor';
import { unlock } from '@wordpress/routes-lock-unlock';
import { ActivatePanel } from './activate-panel';
import { getPreviewedStylesheet, getPreviewTitle } from './previewed-theme';
import './style.scss';

const { GlobalStylesUIWrapper, GlobalStylesActionMenu } =
	unlock( editorPrivateApis );

function Stage() {
	const navigate = useNavigate();
	const search = useSearch( { strict: false } ) as any;
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const isPreviewingTheme = !! getPreviewedStylesheet();
	const [ isActivatePanelOpen, setIsActivatePanelOpen ] = useState( false );
	const { globalStylesId, themeName } = useSelect(
		( select ) => {
			const { getCurrentTheme, __experimentalGetCurrentGlobalStylesId } =
				select( coreStore ) as any;
			const themeNameRendered = isPreviewingTheme
				? getCurrentTheme()?.name?.rendered
				: undefined;
			return {
				globalStylesId: __experimentalGetCurrentGlobalStylesId(),
				themeName: themeNameRendered
					? decodeEntities( themeNameRendered )
					: undefined,
			};
		},
		[ isPreviewingTheme ]
	);
	const { editorSettings } = useEditorSettings( {
		stylesId: globalStylesId,
	} );

	const section = ( search.section ?? '/' ) as string;
	const [ isStyleBookOpened, setIsStyleBookOpened ] = useState(
		search.preview === 'stylebook'
	);

	const onChangeSection = ( updatedSection: string ) => {
		navigate( {
			search: {
				...search,
				section: updatedSection,
			},
		} );
	};

	return (
		<Page
			headingLevel={ 2 }
			actions={
				! isMobileViewport || isPreviewingTheme ? (
					<HStack>
						{ ! isMobileViewport && (
							<>
								<Button
									size="compact"
									isPressed={ isStyleBookOpened }
									icon={ seen }
									label={ __( 'Style Book' ) }
									onClick={ () => {
										const newIsStyleBookOpened =
											! isStyleBookOpened;
										setIsStyleBookOpened(
											newIsStyleBookOpened
										);
										navigate( {
											search: newIsStyleBookOpened
												? {
														...search,
														preview: 'stylebook',
												  }
												: ( () => {
														const {
															preview,
															...restSearch
														} = search;
														return restSearch;
												  } )(),
										} );
									} }
								/>
								<GlobalStylesActionMenu
									hideWelcomeGuide
									onChangePath={ onChangeSection }
								/>
							</>
						) }
						{ isPreviewingTheme && (
							<Button
								size="compact"
								variant="primary"
								onClick={ () => setIsActivatePanelOpen( true ) }
							>
								{ __( 'Activate' ) }
							</Button>
						) }
					</HStack>
				) : null
			}
			className="routes-styles__page"
			title={
				isPreviewingTheme
					? getPreviewTitle( themeName )
					: __( 'Styles' )
			}
		>
			<GlobalStylesUIWrapper
				path={ section }
				onPathChange={ onChangeSection }
				settings={ editorSettings }
			/>
			{ isActivatePanelOpen && (
				<Modal
					title={ __( 'Activate' ) }
					onRequestClose={ () => setIsActivatePanelOpen( false ) }
					size="small"
				>
					<ActivatePanel
						themeName={ themeName }
						onClose={ () => setIsActivatePanelOpen( false ) }
					/>
				</Modal>
			) }
		</Page>
	);
}

export const stage = Stage;
