/**
 * WordPress dependencies
 */
import { useNavigate, useSearch } from '@wordpress/route';
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { useViewportMatch } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	Button,
	Notice,
	Spinner,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { seen } from '@wordpress/icons';
import { useState } from '@wordpress/element';
import { useEditorSettings } from '@wordpress/lazy-editor';
import { unlock } from '@wordpress/routes-lock-unlock';

/**
 * Internal dependencies
 */
import './style.scss';
import { isStylesRouteSupported } from './utils';

const { GlobalStylesUIWrapper, GlobalStylesActionMenu } =
	unlock( editorPrivateApis );

function Stage() {
	const navigate = useNavigate();
	const search = useSearch( { strict: false } ) as any;
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const { currentTheme, globalStylesId } = useSelect(
		( select ) => ( {
			currentTheme: select( coreStore ).getCurrentTheme(),
			globalStylesId: (
				select( coreStore ) as any
			 ).__experimentalGetCurrentGlobalStylesId(),
		} ),
		[]
	);
	const { isReady: areEditorSettingsReady, editorSettings } =
		useEditorSettings( {
			stylesId: globalStylesId,
		} );
	const isReady = !! currentTheme && areEditorSettingsReady;
	const isSupported =
		isReady && isStylesRouteSupported( currentTheme, editorSettings );

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

	if ( ! isReady ) {
		return (
			<Page
				headingLevel={ 2 }
				className="routes-styles__page"
				title={ __( 'Styles' ) }
				hasPadding
			>
				<Spinner />
			</Page>
		);
	}

	if ( ! isSupported ) {
		return (
			<Page
				headingLevel={ 2 }
				className="routes-styles__page"
				title={ __( 'Styles' ) }
				hasPadding
			>
				<Notice status="warning" isDismissible={ false }>
					{ __(
						'The theme you are currently using does not support this screen.'
					) }
				</Notice>
			</Page>
		);
	}

	return (
		<Page
			headingLevel={ 2 }
			actions={
				! isMobileViewport ? (
					<HStack>
						<Button
							size="compact"
							isPressed={ isStyleBookOpened }
							icon={ seen }
							label={ __( 'Style Book' ) }
							onClick={ () => {
								const newIsStyleBookOpened =
									! isStyleBookOpened;
								setIsStyleBookOpened( newIsStyleBookOpened );
								navigate( {
									search: newIsStyleBookOpened
										? { ...search, preview: 'stylebook' }
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
					</HStack>
				) : null
			}
			className="routes-styles__page"
			title={ __( 'Styles' ) }
		>
			<GlobalStylesUIWrapper
				path={ section }
				onPathChange={ onChangeSection }
				settings={ editorSettings }
			/>
		</Page>
	);
}

export const stage = Stage;
