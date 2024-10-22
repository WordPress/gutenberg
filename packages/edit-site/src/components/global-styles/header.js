/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalSpacer as Spacer,
	__experimentalHeading as Heading,
	__experimentalView as View,
	Navigator,
} from '@wordpress/components';
import { isRTL, __ } from '@wordpress/i18n';
import { chevronRight, chevronLeft } from '@wordpress/icons';

function ScreenHeader( { title, description, onBack } ) {
	return (
		<VStack spacing={ 0 }>
			<View>
				<Spacer marginBottom={ 0 } paddingX={ 4 } paddingY={ 3 }>
					<HStack spacing={ 2 }>
						<Navigator.BackButton
							icon={ isRTL() ? chevronRight : chevronLeft }
							size="small"
							label={ __( 'Back' ) }
							onClick={ onBack }
						/>
						<Spacer>
							<Heading
								className="edit-site-global-styles-header"
								level={ 2 }
								size={ 13 }
							>
								{ title }
							</Heading>
						</Spacer>
					</HStack>
				</Spacer>
			</View>
			{ description && (
				<p className="edit-site-global-styles-header__description">
					{ description }
				</p>
			) }
		</VStack>
	);
}

export default ScreenHeader;
