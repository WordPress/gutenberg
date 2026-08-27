import { useNavigate, useSearch } from '@wordpress/route';
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import {
	privateApis as editorPrivateApis,
	store as editorStore,
} from '@wordpress/editor';
import { useViewportMatch } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	Button,
	Modal,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { decodeEntities } from '@wordpress/html-entities';
import { backup, seen } from '@wordpress/icons';
import { useEffect, useState } from '@wordpress/element';
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
	const { globalStylesId, hasRevisions, themeName } = useSelect(
		( select ) => {
			const {
				getCurrentTheme,
				getEntityRecord,
				__experimentalGetCurrentGlobalStylesId,
			} = select( coreStore ) as any;
			const themeNameRendered = isPreviewingTheme
				? getCurrentTheme()?.name?.rendered
				: undefined;
			const _globalStylesId = __experimentalGetCurrentGlobalStylesId();
			const globalStyles = _globalStylesId
				? getEntityRecord( 'root', 'globalStyles', _globalStylesId )
				: undefined;
			return {
				globalStylesId: _globalStylesId,
				hasRevisions:
					!! globalStyles?._links?.[ 'version-history' ]?.[ 0 ]
						?.count,
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
	const areRevisionsOpened = section.startsWith( '/revisions' );

	// The canvas on this route is the editor in preview mode, and its
	// revisions preview is driven by the editor store's styles path rather
	// than this route's `section` search param. Keep the store in sync while
	// the revisions screen is open so selecting a revision previews it in
	// the canvas.
	const { setStylesPath } = unlock( useDispatch( editorStore ) );
	useEffect( () => {
		if ( ! areRevisionsOpened ) {
			return;
		}
		setStylesPath( section );
		return () => setStylesPath( '/' );
	}, [ areRevisionsOpened, section, setStylesPath ] );
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
								<Button
									size="compact"
									isPressed={ areRevisionsOpened }
									icon={ backup }
									label={ __( 'Revisions' ) }
									// The revisions screen has no empty
									// state; it expects to be opened only
									// when revisions exist.
									accessibleWhenDisabled
									disabled={ ! hasRevisions }
									onClick={ () =>
										onChangeSection(
											areRevisionsOpened
												? '/'
												: '/revisions'
										)
									}
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
