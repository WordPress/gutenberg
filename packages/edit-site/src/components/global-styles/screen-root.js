/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalHStack as HStack,
	__experimentalSpacer as Spacer,
	__experimentalVStack as VStack,
	FlexItem,
	CardBody,
	Card,
	CardDivider,
	CardMedia,
} from '@wordpress/components';
import { isRTL, __, sprintf, _n } from '@wordpress/i18n';
import { backup, chevronLeft, chevronRight } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useContext } from '@wordpress/element';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { IconWithCurrentColor } from './icon-with-current-color';
import { NavigationButtonAsItem } from './navigation-button';
import ContextMenu from './context-menu';
import StylesPreview from './preview';
import { unlock } from '../../private-apis';
import { MINIMUM_REVISION_COUNT } from './screen-revisions';

const { GlobalStylesContext } = unlock( blockEditorPrivateApis );
function ScreenRoot() {
	const { useGlobalStyle } = unlock( blockEditorPrivateApis );
	const [ customCSS ] = useGlobalStyle( 'css' );
	const { userConfigRevisionsCount: revisionsCount } =
		useContext( GlobalStylesContext );
	const { variations, canEditCSS } = useSelect( ( select ) => {
		const {
			getEntityRecord,
			__experimentalGetCurrentGlobalStyles,
			__experimentalGetCurrentThemeGlobalStylesVariations,
		} = select( coreStore );

		const currentGlobalStyles = __experimentalGetCurrentGlobalStyles();
		const globalStyles = currentGlobalStyles?.id
			? getEntityRecord( 'root', 'globalStyles', currentGlobalStyles?.id )
			: undefined;

		return {
			variations: __experimentalGetCurrentThemeGlobalStylesVariations(),
			canEditCSS:
				!! globalStyles?._links?.[ 'wp:action-edit-css' ] ?? false,
		};
	}, [] );

	const chevronIcon = isRTL() ? chevronLeft : chevronRight;

	return (
		<Card size="small" className="edit-site-global-styles-screen-root">
			<CardBody>
				<VStack spacing={ 4 }>
					<Card>
						<CardMedia>
							<StylesPreview />
						</CardMedia>
					</Card>
					{ !! variations?.length && (
						<ItemGroup>
							<NavigationButtonAsItem
								path="/variations"
								aria-label={ __( 'Browse styles' ) }
							>
								<HStack justify="space-between">
									<FlexItem>
										{ __( 'Browse styles' ) }
									</FlexItem>
									<IconWithCurrentColor
										icon={ chevronIcon }
									/>
								</HStack>
							</NavigationButtonAsItem>
						</ItemGroup>
					) }
					<ContextMenu />
				</VStack>
			</CardBody>

			<CardDivider />

			<CardBody>
				<Spacer
					as="p"
					paddingTop={ 2 }
					/*
					 * 13px matches the text inset of the NavigationButton (12px padding, plus the width of the button's border).
					 * This is an ad hoc override for this instance and the Addtional CSS option below. Other options for matching the
					 * the nav button inset should be looked at before reusing further.
					 */
					paddingX="13px"
					marginBottom={ 4 }
				>
					{ __(
						'Customize the appearance of specific blocks for the whole site.'
					) }
				</Spacer>
				<ItemGroup>
					<NavigationButtonAsItem
						path="/blocks"
						aria-label={ __( 'Blocks styles' ) }
					>
						<HStack justify="space-between">
							<FlexItem>{ __( 'Blocks' ) }</FlexItem>
							<IconWithCurrentColor icon={ chevronIcon } />
						</HStack>
					</NavigationButtonAsItem>
				</ItemGroup>
			</CardBody>

			{ canEditCSS && !! customCSS && (
				<>
					<CardDivider />
					<CardBody>
						<Spacer
							as="p"
							paddingTop={ 2 }
							paddingX="13px"
							marginBottom={ 4 }
						>
							{ __(
								'Add your own CSS to customize the appearance and layout of your site.'
							) }
						</Spacer>
						<ItemGroup>
							<NavigationButtonAsItem
								path="/css"
								aria-label={ __( 'Additional CSS' ) }
							>
								<HStack justify="space-between">
									<FlexItem>
										{ __( 'Additional CSS' ) }
									</FlexItem>
									<IconWithCurrentColor
										icon={ chevronIcon }
									/>
								</HStack>
							</NavigationButtonAsItem>
						</ItemGroup>
					</CardBody>
				</>
			) }

			{ revisionsCount >= MINIMUM_REVISION_COUNT ? (
				<>
					<CardDivider />
					<CardBody>
						<Spacer
							as="p"
							paddingTop={ 2 }
							paddingX="13px"
							marginBottom={ 4 }
						>
							{ __( "View revisions to your site's styles." ) }
						</Spacer>
						<ItemGroup>
							<NavigationButtonAsItem
								path="/revisions"
								aria-label={ __( 'Styles revisions' ) }
								icon={ backup }
							>
								<HStack justify="space-between">
									<FlexItem>
										{ sprintf(
											/* translators: %d: number of revisions */
											_n(
												'%d Revision',
												'%d Revisions',
												revisionsCount
											),
											revisionsCount
										) }
									</FlexItem>
									<IconWithCurrentColor
										icon={ chevronIcon }
									/>
								</HStack>
							</NavigationButtonAsItem>
						</ItemGroup>
					</CardBody>
				</>
			) : null }
		</Card>
	);
}

export default ScreenRoot;
