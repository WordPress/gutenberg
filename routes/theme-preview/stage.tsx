import { Page } from '@wordpress/admin-ui';
import { Button, Modal } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import {
	store as coreStore,
	privateApis as coreDataPrivateApis,
} from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import { seen } from '@wordpress/icons';
import { useEditorSettings } from '@wordpress/lazy-editor';
import { useNavigate, useSearch } from '@wordpress/route';
import { unlock } from '@wordpress/routes-lock-unlock';
import { Stack } from '@wordpress/ui';
import { activateTheme } from './activate-theme';
import { getPreviewTitle, getPreviewedStylesheet } from './previewed-theme';
import { useActualCurrentTheme } from './use-actual-current-theme';
import styles from './style.module.scss';

const { GlobalStylesUIWrapper, GlobalStylesActionMenu } =
	unlock( editorPrivateApis );
const { EntitiesSavedStatesExtensible, useEntitiesSavedStatesIsDirty } =
	unlock( coreDataPrivateApis );

/**
 * The review-and-activate panel: the same flow as site editor v1's theme
 * preview, where activating saves any pending edits — global styles changes
 * included — against the previewed theme first, then switches to it.
 */
function ActivatePanel( {
	themeName,
	onClose,
}: {
	themeName?: string;
	onClose: () => void;
} ) {
	const isDirtyProps = useEntitiesSavedStatesIsDirty();
	let activateSaveLabel, successNoticeContent;
	if ( isDirtyProps.isDirty ) {
		activateSaveLabel = __( 'Activate & Save' );
		successNoticeContent = __( 'Theme activated and site updated.' );
	} else {
		activateSaveLabel = __( 'Activate' );
		successNoticeContent = __( 'Theme activated.' );
	}

	const currentTheme = useActualCurrentTheme();

	const additionalPrompt = (
		<p>
			{ sprintf(
				/* translators: 1: The name of active theme, 2: The name of theme to be activated. */
				__(
					'Saving your changes will change your active theme from %1$s to %2$s.'
				),
				currentTheme?.name?.rendered ?? '...',
				themeName ?? '...'
			) }
		</p>
	);

	return (
		<EntitiesSavedStatesExtensible
			{ ...isDirtyProps }
			additionalPrompt={ additionalPrompt }
			close={ onClose }
			onSave={ () => activateTheme( getPreviewedStylesheet() ) }
			saveEnabled
			saveLabel={ activateSaveLabel }
			variant="inline"
			successNoticeContent={ successNoticeContent }
		/>
	);
}

function ThemePreviewStage() {
	const navigate = useNavigate();
	const search = useSearch( { strict: false } ) as any;
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const [ isActivatePanelOpen, setIsActivatePanelOpen ] = useState( false );

	const { themeName, globalStylesId, isDirty } = useSelect( ( select ) => {
		const {
			getCurrentTheme,
			__experimentalGetCurrentGlobalStylesId,
			__experimentalGetDirtyEntityRecords,
		} = select( coreStore ) as any;
		// The "current" theme is the previewed one: every REST request on
		// this screen carries the `wp_theme_preview` parameter.
		const themeNameRendered = getCurrentTheme()?.name?.rendered;
		return {
			themeName: themeNameRendered
				? decodeEntities( themeNameRendered )
				: undefined,
			globalStylesId: __experimentalGetCurrentGlobalStylesId(),
			isDirty: __experimentalGetDirtyEntityRecords().length > 0,
		};
	}, [] );
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

	let activateLabel;
	if ( ! themeName ) {
		activateLabel = __( 'Activate' );
	} else if ( isDirty ) {
		activateLabel = sprintf(
			/* translators: %s: Theme name. */
			__( 'Activate %s & Save' ),
			themeName
		);
	} else {
		activateLabel = sprintf(
			/* translators: %s: Theme name. */
			__( 'Activate %s' ),
			themeName
		);
	}

	return (
		<Page
			headingLevel={ 2 }
			actions={
				<Stack direction="row" align="center">
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
					<Button
						size="compact"
						variant="primary"
						onClick={ () => setIsActivatePanelOpen( true ) }
					>
						{ activateLabel }
					</Button>
				</Stack>
			}
			className={ styles.page }
			title={ getPreviewTitle( themeName ) }
		>
			<GlobalStylesUIWrapper
				path={ section }
				onPathChange={ onChangeSection }
				settings={ editorSettings }
			/>
			{ isActivatePanelOpen && (
				<Modal
					title={ activateLabel }
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

export const stage = ThemePreviewStage;
