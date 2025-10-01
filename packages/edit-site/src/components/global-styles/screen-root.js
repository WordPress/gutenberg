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
import { isRTL, __ } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { IconWithCurrentColor } from './icon-with-current-color';
import { NavigationButtonAsItem } from './navigation-button';
import RootMenu from './root-menu';
import PreviewStyles from './preview-styles';

function ScreenRoot() {
	const hasVariations = useSelect( ( select ) => {
		const { __experimentalGetCurrentThemeGlobalStylesVariations } =
			select( coreStore );
		return !! __experimentalGetCurrentThemeGlobalStylesVariations()?.length;
	}, [] );

	return (
		<Card
			size="small"
			isBorderless
			className="edit-site-global-styles-screen-root"
			isRounded={ false }
		>
			<CardBody>
				<VStack spacing={ 4 }>
					<Card className="edit-site-global-styles-screen-root__active-style-tile">
						<CardMedia className="edit-site-global-styles-screen-root__active-style-tile-preview">
							<PreviewStyles />
						</CardMedia>
					</Card>
					{ hasVariations && (
						<ItemGroup>
							<NavigationButtonAsItem path="/variations">
								<HStack justify="space-between">
									<FlexItem>
										{ __( 'Browse styles' ) }
									</FlexItem>
									<IconWithCurrentColor
										icon={
											isRTL() ? chevronLeft : chevronRight
										}
									/>
								</HStack>
							</NavigationButtonAsItem>
						</ItemGroup>
					) }
					<RootMenu />
				</VStack>
			</CardBody>

			<CardDivider />

			<CardBody>
				<Spacer
					as="p"
					paddingTop={ 2 }
					/*
					 * 13px matches the text inset of the NavigationButton (12px padding, plus the width of the button's border).
					 * This is an ad hoc override for this instance and the Additional CSS option below. Other options for matching the
					 * the nav button inset should be looked at before reusing further.
					 */
					paddingX="13px"
					marginBottom={ 2 }
				>
					{ __(
						'Customize the appearance of specific blocks for the whole site.'
					) }
				</Spacer>
				<ItemGroup>
					<NavigationButtonAsItem path="/blocks">
						<HStack justify="space-between">
							<FlexItem>{ __( 'Blocks' ) }</FlexItem>
							<IconWithCurrentColor
								icon={ isRTL() ? chevronLeft : chevronRight }
							/>
						</HStack>
					</NavigationButtonAsItem>
				</ItemGroup>
			</CardBody>
		</Card>
	);
}

export default ScreenRoot;
