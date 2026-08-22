import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Icon, IconButton, Link } from '@wordpress/ui';
import { useWidgetHost } from '@wordpress/widget-primitives';
import type { WidgetAction } from '@wordpress/widget-primitives';
import { getActionRoute } from './get-action-route';
import { useReserveHeaderSpace } from '../widget-header/widget-header-fit';
import styles from './widget-actions.module.css';
import { unlock } from '../../lock-unlock';

const { Menu } = unlock( componentsPrivateApis );

type WidgetActionsProps = {
	/**
	 * The actions this menu materializes. The host routes by relevance:
	 * the footer takes `'high'` and `'medium'`, this menu the rest, and
	 * every action for full-bleed widgets, which have no footer.
	 */
	actions: WidgetAction[];
};

/**
 * Materializes widget actions as a "more" menu in the chrome: a three-dots
 * trigger surfacing each given action. This host mounts a real anchor for the
 * link fulfillment, so middle-click and copy address survive; the menu exposes
 * it as a menu item rather than as a link.
 *
 * A target the host recognizes as one of its own routes (the `links`
 * capability from `useWidgetHost`) mounts the host router's link instead,
 * so it navigates client-side.
 *
 * As a trailing header section it reserves its own footprint, so the
 * collapsible controls beside it never plan for space it occupies.
 *
 * @param {WidgetActionsProps} props Component props.
 */
export function WidgetActions( {
	actions,
}: WidgetActionsProps ): React.ReactNode {
	const reserveRef = useReserveHeaderSpace< HTMLSpanElement >( 'actions' );
	const { links } = useWidgetHost();

	if ( actions.length === 0 ) {
		return null;
	}

	return (
		<span ref={ reserveRef } className={ styles[ 'widget-actions' ] }>
			<Menu>
				<Menu.TriggerButton
					render={
						<IconButton
							icon={ moreVertical }
							label={ __( 'More' ) }
							variant="minimal"
							tone="neutral"
							size="compact"
						/>
					}
				/>

				<Menu.Popover>
					<Menu.Group className={ styles[ 'widget-action-items' ] }>
						{ actions.map( ( action ) => {
							const path = getActionRoute( links, action );
							const HostLink = links?.Link;

							return (
								<Menu.Item
									key={ action.id }
									prefix={
										action.icon ? (
											<Icon icon={ action.icon } />
										) : undefined
									}
									render={
										path !== null && HostLink ? (
											<Link
												className={
													styles[
														'widget-action-link'
													]
												}
												render={
													<HostLink path={ path } />
												}
											/>
										) : (
											<Link
												href={ action.href }
												download={ action.download }
												openInNewTab={
													action.openInNewTab
												}
												className={
													styles[
														'widget-action-link'
													]
												}
											/>
										)
									}
								>
									{ action.label }
								</Menu.Item>
							);
						} ) }
					</Menu.Group>
				</Menu.Popover>
			</Menu>
		</span>
	);
}
