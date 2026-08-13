// eslint-disable-next-line @wordpress/use-recommended-components
import { Link, LinkButton, Stack, Tooltip } from '@wordpress/ui';
import type { WidgetAction, WidgetIcon } from '@wordpress/widget-primitives';
import styles from './widget-footer.module.css';

type WidgetFooterProps = {
	/**
	 * The actions this footer materializes; the host routes the
	 * `relevance: 'high'` ones here.
	 */
	actions: WidgetAction[];

	/**
	 * Inert the footer while customizing, so it does not capture interaction.
	 */
	editMode?: boolean;
};

/**
 * Persistent strip of chrome under the widget body, the prominent surface for
 * the widget's `relevance: 'high'` actions: always visible, unlike the More
 * menu the remaining actions collapse into.
 *
 * Materialization is by declared shape: an action without an icon mounts as a
 * text link on the leading edge; an action with one mounts as an icon-only
 * link on the trailing edge, its label serving as accessible name and tooltip.
 * Both mount real anchors, so middle-click, copy address, and download
 * semantics survive.
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

	const linkActions = actions.filter( ( action ) => ! action.icon );
	const iconActions = actions.filter(
		( action ): action is WidgetAction & { icon: WidgetIcon } =>
			!! action.icon
	);

	return (
		<Stack
			direction="row"
			align="center"
			gap="lg"
			className={ styles[ 'widget-footer' ] }
			{ ...( editMode ? { inert: 'true' } : {} ) }
		>
			{ linkActions.length > 0 && (
				<Stack direction="row" align="center" gap="lg" wrap="wrap">
					{ linkActions.map( ( action ) => (
						<Link
							key={ action.id }
							href={ action.href }
							download={ action.download }
							openInNewTab={ action.openInNewTab }
						>
							{ action.label }
						</Link>
					) ) }
				</Stack>
			) }

			{ iconActions.length > 0 && (
				<Stack
					direction="row"
					align="center"
					gap="xs"
					className={ styles[ 'icon-actions' ] }
				>
					<Tooltip.Provider>
						{ iconActions.map( ( action ) => (
							<Tooltip.Root key={ action.id }>
								<Tooltip.Trigger
									render={
										<LinkButton
											variant="minimal"
											tone="neutral"
											size="compact"
											className={
												styles[ 'icon-action' ]
											}
											aria-label={ action.label }
											href={ action.href }
											download={ action.download }
											openInNewTab={ action.openInNewTab }
										/>
									}
								>
									<LinkButton.Icon icon={ action.icon } />
								</Tooltip.Trigger>
								<Tooltip.Popup>{ action.label }</Tooltip.Popup>
							</Tooltip.Root>
						) ) }
					</Tooltip.Provider>
				</Stack>
			) }
		</Stack>
	);
}
