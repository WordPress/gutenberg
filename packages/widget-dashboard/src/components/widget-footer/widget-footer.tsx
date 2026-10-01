import { __, sprintf } from '@wordpress/i18n';
import { inertValue } from '@wordpress/react-inert-value';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components
	ButtonLink,
	Icon,
	Link,
	Stack,
	Tooltip,
} from '@wordpress/ui';
import { HostLink } from '@wordpress/widget-primitives';
import type {
	WidgetAction,
	WidgetIcon,
	WidgetRuntimeAction,
} from '@wordpress/widget-primitives';
import { isCallbackAction } from '../../utils/action-fulfillment';
import { CallbackAction } from '../widget-actions/callback-action';
import { useRunActions } from '../widget-actions/use-run-actions';
import styles from './widget-footer.module.css';

type IconActionProps = {
	/**
	 * The action to materialize.
	 */
	action: WidgetAction & { icon: WidgetIcon };
};

/**
 * Icon-only link. `openInNewTab` mounts the target on the anchor rather
 * than through `Link`, whose external glyph would double the icon; the
 * new-tab hint joins the accessible name.
 *
 * @param {IconActionProps} props Component props.
 */
function IconAction( { action }: IconActionProps ): React.ReactNode {
	const label = action.openInNewTab
		? sprintf(
				/* translators: %s: action label. */
				__( '%s (opens in a new tab)' ),
				action.label
			)
		: action.label;

	return (
		<Tooltip.Root>
			<Tooltip.Trigger
				render={
					<ButtonLink
						variant="minimal"
						tone="neutral"
						size="compact"
						className={ styles[ 'icon-action' ] }
						aria-label={ label }
						render={
							<HostLink
								href={ action.href }
								download={ action.download }
								{ ...( action.openInNewTab
									? {
											target: '_blank',
											rel: 'noopener noreferrer',
										}
									: {} ) }
							/>
						}
					/>
				}
			>
				<ButtonLink.Icon icon={ action.icon } />
			</Tooltip.Trigger>
			<Tooltip.Popup>{ action.label }</Tooltip.Popup>
		</Tooltip.Root>
	);
}

type WidgetFooterProps = {
	/**
	 * The instance whose actions these are.
	 */
	uuid: string;

	/**
	 * The promoted actions (`relevance: 'high'` and `'medium'`).
	 */
	actions: WidgetRuntimeAction[];

	/**
	 * Inert the footer while customizing.
	 */
	editMode?: boolean;
};

/**
 * Persistent strip under the widget body. `'high'` actions mount as leading
 * text affordances, a declared icon riding as prefix; `'medium'` actions as
 * trailing compact affordances, icon-only when they declare an icon. Every
 * link is a real anchor; a callback action mounts a button, disabled while
 * its promise settles.
 *
 * A target the host recognizes as one of its own routes mounts the host
 * router's link through `HostLink`, so it navigates client-side.
 *
 * @param {WidgetFooterProps} props Component props.
 */
export function WidgetFooter( {
	uuid,
	actions,
	editMode = false,
}: WidgetFooterProps ): React.ReactNode {
	const { run, pendingIds } = useRunActions( uuid );

	if ( actions.length === 0 ) {
		return null;
	}

	const highActions = actions.filter(
		( action ) => action.relevance === 'high'
	);
	const mediumActions = actions.filter(
		( action ) => action.relevance === 'medium'
	);

	return (
		<Stack
			direction="row"
			align="center"
			gap="lg"
			className={ styles[ 'widget-footer' ] }
			// @ts-expect-error `inert` is not declared in React 18's HTML attribute types.
			inert={ inertValue( editMode ) }
		>
			{ highActions.length > 0 && (
				<Stack direction="row" align="center" gap="lg" wrap="wrap">
					{ highActions.map( ( action ) =>
						isCallbackAction( action ) ? (
							<CallbackAction
								key={ action.id }
								action={ action }
								isPending={ pendingIds.has( action.id ) }
								onRun={ run }
							/>
						) : (
							<Link
								key={ action.id }
								className={
									action.icon
										? styles[ 'prefixed-action' ]
										: undefined
								}
								download={ action.download }
								openInNewTab={ action.openInNewTab }
								render={ <HostLink href={ action.href } /> }
							>
								{ action.icon && <Icon icon={ action.icon } /> }
								{ action.label }
							</Link>
						)
					) }
				</Stack>
			) }

			{ mediumActions.length > 0 && (
				<Stack
					direction="row"
					align="center"
					gap="xs"
					className={ styles[ 'compact-actions' ] }
				>
					<Tooltip.Provider>
						{ mediumActions.map( ( action ) => {
							if ( isCallbackAction( action ) ) {
								return (
									<CallbackAction
										key={ action.id }
										action={ action }
										isPending={ pendingIds.has(
											action.id
										) }
										onRun={ run }
										compact
									/>
								);
							}

							return action.icon ? (
								<IconAction
									key={ action.id }
									action={ { ...action, icon: action.icon } }
								/>
							) : (
								<Link
									key={ action.id }
									download={ action.download }
									openInNewTab={ action.openInNewTab }
									render={ <HostLink href={ action.href } /> }
								>
									{ action.label }
								</Link>
							);
						} ) }
					</Tooltip.Provider>
				</Stack>
			) }
		</Stack>
	);
}
