import { __, sprintf } from '@wordpress/i18n';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Icon, Link, LinkButton, Stack, Tooltip } from '@wordpress/ui';
import type { WidgetAction, WidgetIcon } from '@wordpress/widget-primitives';
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
					<LinkButton
						variant="minimal"
						tone="neutral"
						size="compact"
						className={ styles[ 'icon-action' ] }
						aria-label={ label }
						href={ action.href }
						download={ action.download }
						render={
							action.openInNewTab ? (
								/* href and content merge in at runtime. */
								// eslint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/anchor-is-valid
								<a target="_blank" rel="noopener noreferrer" />
							) : undefined
						}
					/>
				}
			>
				<LinkButton.Icon icon={ action.icon } />
			</Tooltip.Trigger>
			<Tooltip.Popup>{ action.label }</Tooltip.Popup>
		</Tooltip.Root>
	);
}

type WidgetFooterProps = {
	/**
	 * The promoted actions (`relevance: 'high'` and `'medium'`).
	 */
	actions: WidgetAction[];

	/**
	 * Inert the footer while customizing.
	 */
	editMode?: boolean;
};

/**
 * Persistent strip under the widget body. `'high'` actions mount as leading
 * text links, a declared icon riding as prefix; `'medium'` actions as
 * trailing compact affordances, icon-only when they declare an icon. Every
 * affordance is a real anchor.
 *
 * @param {WidgetFooterProps} props Component props.
 */
export function WidgetFooter( {
	actions,
	editMode = false,
}: WidgetFooterProps ): React.ReactNode {
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
			{ ...( editMode ? { inert: 'true' } : {} ) }
		>
			{ highActions.length > 0 && (
				<Stack direction="row" align="center" gap="lg" wrap="wrap">
					{ highActions.map( ( action ) => (
						<Link
							key={ action.id }
							href={ action.href }
							download={ action.download }
							openInNewTab={ action.openInNewTab }
							className={
								action.icon
									? styles[ 'prefixed-action' ]
									: undefined
							}
						>
							{ action.icon && <Icon icon={ action.icon } /> }
							{ action.label }
						</Link>
					) ) }
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
						{ mediumActions.map( ( action ) =>
							action.icon ? (
								<IconAction
									key={ action.id }
									action={ {
										...action,
										icon: action.icon,
									} }
								/>
							) : (
								<Link
									key={ action.id }
									href={ action.href }
									download={ action.download }
									openInNewTab={ action.openInNewTab }
								>
									{ action.label }
								</Link>
							)
						) }
					</Tooltip.Provider>
				</Stack>
			) }
		</Stack>
	);
}
