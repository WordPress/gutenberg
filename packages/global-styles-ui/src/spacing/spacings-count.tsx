import { __, isRTL } from '@wordpress/i18n';
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import { Icon, chevronLeft, chevronRight } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';
import { Subtitle } from '../subtitle';
import { NavigationButtonAsItem } from '../navigation-button';

function SpacingsCount() {
	return (
		<Stack direction="column" gap="sm">
			<Subtitle level={ 3 }>{ __( 'Spacing Sizes' ) }</Subtitle>
			<ItemGroup isBordered isSeparated>
				<NavigationButtonAsItem path="/layout/spacing">
					<Stack
						direction="row"
						justify="space-between"
						align="center"
					>
						<span>{ __( 'Spacing size presets' ) }</span>
						<Icon icon={ isRTL() ? chevronLeft : chevronRight } />
					</Stack>
				</NavigationButtonAsItem>
			</ItemGroup>
		</Stack>
	);
}

export default SpacingsCount;
