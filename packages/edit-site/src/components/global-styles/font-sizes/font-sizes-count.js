/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { __, _n, sprintf, isRTL } from '@wordpress/i18n';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	FlexItem,
} from '@wordpress/components';
import { Icon, chevronLeft, chevronRight } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';
const { useGlobalSetting } = unlock( blockEditorPrivateApis );
import Subtitle from '../subtitle';
import { NavigationButtonAsItem } from '../navigation-button';

function FontSizes() {
	const [ fontSizes ] = useGlobalSetting( 'typography.fontSizes' );

	const [ defaultFontSizesEnabled ] = useGlobalSetting(
		'typography.defaultFontSizes'
	);

	// Count the number of font sizes from the theme or use the default ones.
	const fontSizesCount = [
		// Default font sizes are only counted if enabled.
		...( defaultFontSizesEnabled ? fontSizes.default || [] : [] ),
		...( fontSizes.theme || [] ),
		...( fontSizes.custom || [] ),
	].length;

	return (
		<VStack spacing={ 2 }>
			<HStack justify="space-between">
				<Subtitle level={ 3 }>{ __( 'Font Sizes' ) }</Subtitle>
			</HStack>
			<ItemGroup isBordered isSeparated>
				<NavigationButtonAsItem
					path="/typography/font-sizes/"
					aria-label={ __( 'Edit font size presets' ) }
				>
					<HStack direction="row">
						<FlexItem>
							{ sprintf(
								/* translators: %d: number of font sizes */
								_n(
									'%d Font size preset',
									'%d Font size presets',
									fontSizesCount
								),
								fontSizesCount
							) }
						</FlexItem>
						<Icon icon={ isRTL() ? chevronLeft : chevronRight } />
					</HStack>
				</NavigationButtonAsItem>
			</ItemGroup>
		</VStack>
	);
}

export default FontSizes;
