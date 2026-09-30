// eslint-disable-next-line @wordpress/use-recommended-components
import { Button, IconButton } from '@wordpress/ui';
import type { WidgetCallbackAction } from '@wordpress/widget-primitives';

interface CallbackActionProps {
	action: WidgetCallbackAction;

	/**
	 * Whether a promise the callback returned is still settling.
	 */
	isPending: boolean;

	/**
	 * Runs the action.
	 */
	onRun: ( action: WidgetCallbackAction ) => void;

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
	isPending,
	onRun,
	compact = false,
}: CallbackActionProps ): React.ReactNode {
	if ( compact && action.icon ) {
		return (
			<IconButton
				icon={ action.icon }
				label={ action.label }
				variant="minimal"
				tone="neutral"
				size="compact"
				disabled={ isPending }
				onClick={ () => onRun( action ) }
			/>
		);
	}

	return (
		<Button
			variant="minimal"
			tone={ compact ? 'neutral' : 'brand' }
			size="compact"
			disabled={ isPending }
			onClick={ () => onRun( action ) }
		>
			{ action.icon && <Button.Icon icon={ action.icon } /> }
			{ action.label }
		</Button>
	);
}
