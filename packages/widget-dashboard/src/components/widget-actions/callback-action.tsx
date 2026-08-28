// eslint-disable-next-line @wordpress/use-recommended-components
import { Button, IconButton } from '@wordpress/ui';
import type { WidgetCallbackAction } from '@wordpress/widget-primitives';
import { useRunAction } from './use-run-action';

interface CallbackActionProps {
	action: WidgetCallbackAction;

	/**
	 * The footer's trailing form: icon-only when the action declares an
	 * icon, a compact neutral button otherwise.
	 */
	compact?: boolean;
}

/**
 * Materializes a callback action as a button, disabled while its promise
 * settles. Text with the icon as prefix by default.
 *
 * @param {CallbackActionProps} props Component props.
 */
export function CallbackAction( {
	action,
	compact = false,
}: CallbackActionProps ): React.ReactNode {
	const { run, isPending } = useRunAction( action );

	if ( compact && action.icon ) {
		return (
			<IconButton
				icon={ action.icon }
				label={ action.label }
				variant="minimal"
				tone="neutral"
				size="compact"
				disabled={ isPending }
				onClick={ run }
			/>
		);
	}

	return (
		<Button
			variant="minimal"
			tone={ compact ? 'neutral' : 'brand' }
			size="compact"
			disabled={ isPending }
			onClick={ run }
		>
			{ action.icon && <Button.Icon icon={ action.icon } /> }
			{ action.label }
		</Button>
	);
}
