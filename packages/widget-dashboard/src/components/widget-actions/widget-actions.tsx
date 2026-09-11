import { __ } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';
import { useRef } from '@wordpress/element';
// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
import { Icon, IconButton, Menu } from '@wordpress/ui';
import { useWidgetHost } from '@wordpress/widget-primitives';
import type { WidgetAction } from '@wordpress/widget-primitives';
import { getActionRoute } from './get-action-route';
import { useReserveHeaderSpace } from '../widget-header/widget-header-fit';
import styles from './widget-actions.module.css';

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
	const menuActionsRef = useRef< {
		close: () => void;
		unmount: () => void;
	} | null >( null );
	const { links } = useWidgetHost();

	if ( actions.length === 0 ) {
		return null;
	}

	return (
		<span ref={ reserveRef } className={ styles[ 'widget-actions' ] }>
			<Menu.Root actionsRef={ menuActionsRef }>
				<Menu.Trigger
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

				<Menu.Popup>
					<Menu.Group>
						{ actions.map( ( action ) => {
							const path = getActionRoute( links, action );
							const HostLink = links?.Link;
							const linkProps =
								path !== null && HostLink
									? { render: <HostLink path={ path } /> }
									: {
											href: action.href,
											download: action.download,
											openInNewTab: action.openInNewTab,
									  };

							return (
								<Menu.LinkItem
									key={ action.id }
									{ ...linkProps }
									onClick={ ( event ) => {
										if (
											! event.metaKey &&
											! event.ctrlKey &&
											! event.altKey &&
											! event.shiftKey
										) {
											menuActionsRef.current?.close();
										}
									} }
									prefix={
										action.icon ? (
											<Icon icon={ action.icon } />
										) : undefined
									}
								>
									<Menu.ItemLabel>
										{ action.label }
									</Menu.ItemLabel>
								</Menu.LinkItem>
							);
						} ) }
					</Menu.Group>
				</Menu.Popup>
			</Menu.Root>
		</span>
	);
}
