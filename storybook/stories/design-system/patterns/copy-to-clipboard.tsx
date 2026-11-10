import { Button, IconButton, Stack, Text } from '@wordpress/ui';
import { RESULT_ICON, useCopyFeedback } from './use-copy-feedback';

const SAMPLE_VALUE = 'Sample text';

/**
 * Composes `Button` into a copy action with inline feedback.
 *
 * The visible label and accessible name stay "Copy". A check icon shows
 * success and an error icon shows failure. `speak()` announces the outcome.
 */
export function CopyToClipboardExample() {
	const { result, ref } = useCopyFeedback( SAMPLE_VALUE );

	return (
		<Stack direction="row" gap="sm" align="center">
			<Text>{ SAMPLE_VALUE }</Text>
			<Button ref={ ref } variant="minimal" tone="neutral" size="compact">
				<Button.Icon icon={ RESULT_ICON[ result ] } />
				Copy
			</Button>
		</Stack>
	);
}

/**
 * Composes `IconButton` into the same copy action.
 *
 * `label` stays "Copy", so the accessible name and tooltip do not change.
 * A check icon shows success and an error icon shows failure. `speak()`
 * announces the outcome.
 */
export function CopyToClipboardIconButtonExample() {
	const { result, ref } = useCopyFeedback( SAMPLE_VALUE );

	return (
		<Stack direction="row" gap="sm" align="center">
			<Text>{ SAMPLE_VALUE }</Text>
			<IconButton
				ref={ ref }
				label="Copy"
				icon={ RESULT_ICON[ result ] }
				variant="minimal"
				tone="neutral"
				size="compact"
			/>
		</Stack>
	);
}

/**
 * Labeled and icon-only copy actions, shown together in the pattern.
 */
export function CopyToClipboardExamples() {
	return (
		<Stack direction="column" gap="lg">
			<CopyToClipboardExample />
			<CopyToClipboardIconButtonExample />
		</Stack>
	);
}
