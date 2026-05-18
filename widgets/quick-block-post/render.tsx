/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';

export default function QuickBlockPost() {
	return (
		<Stack direction="column" gap="md">
			<Text variant="heading-md">{ __( 'Quick Block Post' ) }</Text>
			<Text variant="body-sm">
				{ __( 'Quickly publish a new block-based post.' ) }
			</Text>
		</Stack>
	);
}
