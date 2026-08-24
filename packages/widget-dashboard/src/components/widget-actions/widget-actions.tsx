import { __ } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Icon, IconButton, Menu } from '@wordpress/ui';
import type { WidgetAction } from '@wordpress/widget-primitives';
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
 * As a trailing header section it reserves its own footprint, so the
 * collapsible controls beside it never plan for space it occupies.
 *
 * @param {WidgetActionsProps} props Component props.
 */
export function WidgetActions( {
	actions,
}: WidgetActionsProps ): React.ReactNode {
	const reserveRef = useReserveHeaderSpace< HTMLSpanElement >( 'actions' );

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
					{ actions.map( ( action ) => (
						<Menu.LinkItem
							key={ action.id }
							href={ action.href }
							download={ action.download }
							openInNewTab={ action.openInNewTab }
							closeOnClick
							prefix={
								action.icon ? (
									<Icon icon={ action.icon } />
								) : undefined
							}
						>
							<Menu.ItemLabel>{ action.label }</Menu.ItemLabel>
						</Menu.LinkItem>
					) ) }
				</Menu.Popup>
			</Menu.Root>
		</span>
	);
}
