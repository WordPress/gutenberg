import { Stack, Text } from '@wordpress/ui';

export default function HelloWorld() {
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
			<Text variant="heading-2xl">Hello World</Text>
		</Stack>
	);
}
