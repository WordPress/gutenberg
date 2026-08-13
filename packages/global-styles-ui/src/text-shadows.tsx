import { __, isRTL } from '@wordpress/i18n';
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { Icon, chevronLeft, chevronRight } from '@wordpress/icons';
import { Subtitle } from './subtitle';
import { NavigationButtonAsItem } from './navigation-button';

function TextShadows() {
	return (
		<Stack direction="column" gap="sm">
			<Subtitle level={ 3 }>{ __( 'Text Shadows' ) }</Subtitle>
			<ItemGroup isBordered isSeparated>
				<NavigationButtonAsItem path="/typography/text-shadows">
					<Stack
						direction="row"
						justify="space-between"
						align="center"
					>
						<span>{ __( 'Text shadow presets' ) }</span>
						<Icon icon={ isRTL() ? chevronLeft : chevronRight } />
					</Stack>
				</NavigationButtonAsItem>
			</ItemGroup>
		</Stack>
	);
}

export default TextShadows;
