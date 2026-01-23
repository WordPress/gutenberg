/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalSpacer as Spacer,
	__experimentalHeading as Heading,
	__experimentalView as View,
	__experimentalText as Text,
	Navigator,
} from '@wordpress/components';
import { isRTL, __ } from '@wordpress/i18n';
import { chevronRight, chevronLeft } from '@wordpress/icons';

interface ScreenHeaderProps {
	title: string;
	description?: string | React.ReactElement;
	onBack?: () => void;
}

export function ScreenHeader( {
	title,
	description,
	onBack,
}: ScreenHeaderProps ) {
	return (
		<VStack spacing={ 0 }>
			<View>
				<Spacer marginBottom={ 0 } paddingX={ 4 } paddingY={ 3 }>
					<VStack spacing={ 2 }>
						<HStack spacing={ 2 }>
							<Navigator.BackButton
								icon={ isRTL() ? chevronRight : chevronLeft }
								size="small"
								label={ __( 'Back' ) }
								onClick={ onBack }
							/>
							<Spacer>
								<Heading
									className="global-styles-ui-header"
									level={ 2 }
									size={ 13 }
								>
									{ title }
								</Heading>
							</Spacer>
						</HStack>
						{ description && (
							<Text className="global-styles-ui-header__description">
								{ description }
							</Text>
						) }
					</VStack>
				</Spacer>
			</View>
		</VStack>
	);
}
