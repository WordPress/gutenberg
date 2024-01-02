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

function ScreenHeader( { title, description, children } ) {
	return (
		<VStack spacing={ 0 }>
			<View>
				<Spacer marginBottom={ 0 } paddingX={ 4 } paddingY={ 3 }>
					<HStack spacing={ 2 }>
						{ children }
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
