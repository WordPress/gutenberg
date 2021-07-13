/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalHeading as Heading,
	__experimentalHStack as HStack,
	Icon,
	NavigatorLink,
	__experimentalSpacer as Spacer,
	__experimentalText as Text,
	__experimentalView as View,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { chevronLeft } from '@wordpress/icons';

export const ScreenHeader = ( { action, back, description, title } ) => {
	return (
		<VStack spacing={ 5 }>
			<HStack spacing={ 2 }>
				<View>
					<NavigatorLink isBack to={ back }>
						<Button
							icon={
								<Icon icon={ chevronLeft } variant="muted" />
							}
							size="small"
						/>
					</NavigatorLink>
				</View>
				<Spacer>
					<Heading size={ 5 }>{ title }</Heading>
				</Spacer>
				<View>{ action }</View>
			</HStack>
			{ description && <Text variant="muted">{ description }</Text> }
		</VStack>
	);
};
