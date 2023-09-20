/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Button,
	Icon,
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
	__experimentalText as Text,
} from '@wordpress/components';
import { symbol } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import AddNewPattern from '../add-new-pattern';

export default function NoPatterns() {
	return (
		<VStack
			spacing={ 6 }
			alignment="center"
			className="edit-site-patterns__no-results"
		>
			<Icon icon={ symbol } />
			<VStack spacing={ 3 } alignment="center">
				<Heading level={ 4 } as="h2">
					{ __( 'Create a pattern' ) }
				</Heading>
				<Text>
					{ __(
						'Reuse common block combinations and layouts across your site.'
					) }
				</Text>
			</VStack>
			<AddNewPattern
				renderTrigger={ ( { setShowPatternModal } ) => (
					<Button
						onClick={ () => setShowPatternModal( true ) }
						variant="primary"
					>
						{ __( 'New pattern' ) }
					</Button>
				) }
			/>
		</VStack>
	);
}
