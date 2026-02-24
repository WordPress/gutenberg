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
import { Button, __experimentalHStack as HStack } from '@wordpress/components';
import { seen } from '@wordpress/icons';
import { useState } from '@wordpress/element';
import { useEditorSettings } from '@wordpress/lazy-editor';

/**
 * Internal dependencies
 */
import './style.scss';
import { unlock } from '../lock-unlock';

const { GlobalStylesUIWrapper, GlobalStylesActionMenu } =
	unlock( editorPrivateApis );

function Stage() {
	const navigate = useNavigate();
	const search = useSearch( { strict: false } ) as any;
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const globalStylesId = useSelect(
		( select ) =>
			(
				select( coreStore ) as any
			 ).__experimentalGetCurrentGlobalStylesId(),
		[]
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
				editorSettings={ editorSettings }
			/>
		</Page>
	);
}

export const stage = Stage;
