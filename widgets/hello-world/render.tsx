import { Stack, Text } from '@wordpress/ui';

interface HelloWorldAttributes {
	message?: string;
}

export default function HelloWorld( {
	attributes,
}: {
	attributes?: HelloWorldAttributes;
} ) {
	return (
		<Stack
			align="center"
			justify="center"
			style={ {
				height: '100%',
				padding: 'var(--wpds-dimension-padding-2xl)',
				backgroundColor: 'var(--wpds-color-bg-surface-brand)',
				color: 'var(--wpds-color-fg-interactive-brand)',
			} }
		>
			<Text variant="heading-2xl">
				{ attributes?.message || 'Hello World' }
			</Text>
		</Stack>
	);
}
