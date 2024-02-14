/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import {
	FlexItem,
	__experimentalItemGroup as ItemGroup,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { store as editorStore } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import TypographyElements from './typography-elements';
import { IconWithCurrentColor } from './icon-with-current-color';
import FontFamilies from './font-families';
import ScreenHeader from './header';
import { NavigationButtonAsItem } from './navigation-button';
import { useCurrentMergeThemeStyleVariationsWithUserConfig } from '../../hooks/use-theme-style-variations/use-theme-style-variations-by-property';

function ScreenTypography() {
	const fontLibraryEnabled = useSelect(
		( select ) =>
			select( editorStore ).getEditorSettings().fontLibraryEnabled,
		[]
	);
	const typographyVariations =
		useCurrentMergeThemeStyleVariationsWithUserConfig( {
			property: 'typography',
			filter: ( variation ) =>
				variation?.settings?.typography?.fontFamilies &&
				Object.keys( variation?.settings?.typography?.fontFamilies )
					.length,
		} );

	return (
		<>
			<ScreenHeader
				title={ __( 'Typography' ) }
				description={ __(
					'Manage the typography settings for different elements.'
				) }
			/>
			<div className="edit-site-global-styles-screen-typography">
				<VStack spacing={ 6 }>
					{ ! window.__experimentalDisableFontLibrary && (
						<VStack spacing={ 3 }>
							{ fontLibraryEnabled && <FontFamilies /> }
							{ /* @TODO: abstract into component */ }
							{ !! typographyVariations.length && (
								<ItemGroup isBordered>
									<NavigationButtonAsItem
										path="/typography/typesets"
										aria-label={ __( 'Typesets' ) }
									>
										<HStack justify="space-between">
											<FlexItem>
												{ /* @TODO: think about this category. Could we stress "variations" typography styles to make descriptions/labelling easier (no font-name farming) */ }
												{ __( 'Typesets' ) }
											</FlexItem>
											<IconWithCurrentColor
												icon={
													isRTL()
														? chevronLeft
														: chevronRight
												}
											/>
										</HStack>
									</NavigationButtonAsItem>
								</ItemGroup>
							) }
						</VStack>
					) }
					<TypographyElements />
				</VStack>
			</div>
		</>
	);
}

export default ScreenTypography;
