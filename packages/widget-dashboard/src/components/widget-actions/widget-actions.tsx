import { __ } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';
// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
import { IconButton, Menu } from '@wordpress/ui';
import { HostLink } from '@wordpress/widget-primitives';
import type { WidgetRuntimeAction } from '@wordpress/widget-primitives';
import { useRunActions } from './use-run-actions';
import { useReserveHeaderSpace } from '../widget-header/widget-header-fit';
import { isCallbackAction } from '../../utils/action-fulfillment';
import styles from './widget-actions.module.css';

type WidgetActionsProps = {
	/**
	 * The instance whose actions these are.
	 */
	uuid: string;

	/**
	 * The actions this menu materializes. The host routes by relevance:
	 * the footer takes `'high'` and `'medium'`, this menu the rest, and
	 * every action for full-bleed widgets, which have no footer.
	 */
	actions: WidgetRuntimeAction[];
};

/**
 * Materializes widget actions as a "more" menu in the chrome: a three-dots
 * trigger surfacing each given action. This host mounts a real anchor for the
 * link fulfillment, so middle-click and copy address survive; the menu exposes
 * it as a menu item rather than as a link.
 *
 * A target the host recognizes as one of its own routes mounts the host
 * router's link through `HostLink`, so it navigates client-side.
 *
 * A callback action mounts a menu item, disabled while its promise settles.
 * That state lives with the instance, so it survives the popup closing and
 * customize mode.
 *
 * As a trailing header section it reserves its own footprint, so the
 * collapsible controls beside it never plan for space it occupies.
 *
 * @param {WidgetActionsProps} props Component props.
 */
export function WidgetActions( {
	uuid,
	actions,
}: WidgetActionsProps ): React.ReactNode {
	const reserveRef = useReserveHeaderSpace< HTMLSpanElement >( 'actions' );
	const { run, pendingIds } = useRunActions( uuid );

	if ( actions.length === 0 ) {
		return null;
	}

	return (
		<span ref={ reserveRef } className={ styles[ 'widget-actions' ] }>
			<Menu.Root>
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
						{ actions.map( ( action ) =>
							isCallbackAction( action ) ? (
								<Menu.Item
									key={ action.id }
									disabled={ pendingIds.has( action.id ) }
									onClick={ () => run( action ) }
									prefix={
										action.icon ? (
											<Menu.PrefixIcon
												icon={ action.icon }
											/>
										) : undefined
									}
								>
									<Menu.ItemLabel>
										{ action.label }
									</Menu.ItemLabel>
								</Menu.Item>
							) : (
								<Menu.LinkItem
									key={ action.id }
									download={ action.download }
									openInNewTab={ action.openInNewTab }
									render={ <HostLink href={ action.href } /> }
									closeOnClick
									prefix={
										action.icon ? (
											<Menu.PrefixIcon
												icon={ action.icon }
											/>
										) : undefined
									}
								>
									<Menu.ItemLabel>
										{ action.label }
									</Menu.ItemLabel>
								</Menu.LinkItem>
							)
						) }
					</Menu.Group>
				</Menu.Popup>
			</Menu.Root>
		</span>
	);
}
