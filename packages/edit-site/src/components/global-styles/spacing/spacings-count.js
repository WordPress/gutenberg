/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
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
import Subtitle from '../subtitle';
import { NavigationButtonAsItem } from '../navigation-button';

function Spacings() {
	return (
		<VStack spacing={ 2 }>
			<HStack justify="space-between">
				<Subtitle level={ 3 }>{ __( 'Spacing Sizes' ) }</Subtitle>
			</HStack>
			<ItemGroup isBordered isSeparated>
				<NavigationButtonAsItem path="/layout/spacing">
					<HStack direction="row">
						<FlexItem>{ __( 'Spacing size presets' ) }</FlexItem>
						<Icon icon={ isRTL() ? chevronLeft : chevronRight } />
					</HStack>
				</NavigationButtonAsItem>
			</ItemGroup>
		</VStack>
	);
}

export default Spacings;
