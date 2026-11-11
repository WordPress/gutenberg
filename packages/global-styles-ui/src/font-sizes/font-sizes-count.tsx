import { __, isRTL } from '@wordpress/i18n';
import {
	__experimentalItemGroup as WCItemGroup,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	FlexItem,
} from '@wordpress/components';
import { Icon, chevronLeft, chevronRight } from '@wordpress/icons';
import { Subtitle } from '../subtitle';
import { NavigationButtonAsItem } from '../navigation-button';

function FontSizes() {
	return (
		<VStack spacing={ 2 }>
			<HStack justify="space-between">
				<Subtitle level={ 3 }>{ __( 'Font Sizes' ) }</Subtitle>
			</HStack>
			<WCItemGroup isBordered isSeparated>
				<NavigationButtonAsItem path="/typography/font-sizes">
					<HStack direction="row">
						<FlexItem>{ __( 'Font size presets' ) }</FlexItem>
						<Icon icon={ isRTL() ? chevronLeft : chevronRight } />
					</HStack>
				</NavigationButtonAsItem>
			</WCItemGroup>
		</VStack>
	);
}

export default FontSizes;
