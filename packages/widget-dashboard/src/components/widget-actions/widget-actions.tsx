/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';
// eslint-disable-next-line @wordpress/use-recommended-components
import { IconButton, Link } from '@wordpress/ui';
import type { WidgetType } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { useReserveHeaderSpace } from '../widget-header/widget-header-fit';
import styles from './widget-actions.module.css';

import { unlock } from '../../lock-unlock';

const { Menu } = unlock( componentsPrivateApis );

type WidgetActionsProps = {
	/**
	 * The widget type whose declared actions render here.
	 */
	widgetType: WidgetType;
};

/**
 * Materializes a widget type's declared `actions` as a "more" menu in the
 * chrome: a three-dots trigger surfacing each action as a link. Each action
 * is a declarative link target; the host renders it as an anchor and owns
 * placement.
 *
 * As a trailing header section it reserves its own footprint, so the
 * collapsible controls beside it never plan for space it occupies.
 *
 * @param {WidgetActionsProps} props Component props.
 */
export function WidgetActions( {
	widgetType,
}: WidgetActionsProps ): React.ReactNode {
	const actions = widgetType.actions ?? [];
	const reserveRef = useReserveHeaderSpace< HTMLSpanElement >( 'actions' );

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
						{ actions.map( ( action ) => (
							<Menu.Item
								key={ action.id }
								render={
									<Link
										href={ action.href }
										download={ action.download }
										openInNewTab={ action.openInNewTab }
										className={
											styles[ 'widget-action-link' ]
										}
									/>
								}
							>
								{ action.label }
							</Menu.Item>
						) ) }
					</Menu.Group>
				</Menu.Popover>
			</Menu>
		</span>
	);
}
