/**
 * WordPress dependencies
 */
import {
	__experimentalText as Text,
	__experimentalHeading as Heading,
	__experimentalVStack as VStack,
	__experimentalSpacer as Spacer,
	__experimentalHStack as HStack,
	Button,
} from '@wordpress/components';
import { chevronLeft } from '@wordpress/icons';

function TabLayout( { title, description, handleBack, children, footer } ) {
	return (
		<div className="font-library-modal__tab-layout">
			<Spacer margin={ 4 } />
			<VStack spacing={ 4 } justify="space-between">
				<header>
					<VStack spacing={ 2 }>
						<HStack justify="flex-start">
							{ !! handleBack && (
								<Button
									variant="tertiary"
									onClick={ handleBack }
									icon={ chevronLeft }
									size="small"
								/>
							) }
							{ title && (
								<Heading
									level={ 2 }
									size={ 13 }
									className="edit-site-global-styles-header"
								>
									{ title }
								</Heading>
							) }
						</HStack>
						{ description && <Text>{ description }</Text> }
					</VStack>
				</header>
				<main>{ children }</main>
				{ footer && <footer>{ footer }</footer> }
			</VStack>
		</div>
	);
}

export default TabLayout;
