/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalSpacer as Spacer,
	__experimentalHeading as Heading,
	__experimentalView as View,
} from '@wordpress/components';
import { isRTL } from '@wordpress/i18n';
import { chevronRight, chevronLeft, Icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import NavigationButton from './navigation-button';

function ScreenHeader( { back, title, description } ) {
	return (
		<VStack spacing={ 2 }>
			<HStack spacing={ 2 }>
				<View>
					<NavigationButton
						path={ back }
						icon={
							<Icon
								icon={ isRTL() ? chevronRight : chevronLeft }
								variant="muted"
							/>
						}
						size="small"
						isBack
					/>
				</View>
				<Spacer>
					<Heading level={ 5 }>{ title }</Heading>
				</Spacer>
			</HStack>
			{ description && (
				<p className="edit-site-global-styles-header__description">
					{ description }
				</p>
			) }
		</VStack>
	);
}

export default ScreenHeader;
