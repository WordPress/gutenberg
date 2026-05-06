/**
 * WordPress dependencies
 */
import { forwardRef, useMemo } from '@wordpress/element';
import { Card } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { WidgetContextProvider } from '../../context/widget-context';
import { WidgetRender } from '../widget-render';
import styles from './widget.module.css';
import type { DashboardWidget } from '../../types';

export interface WidgetProps {
	widget: DashboardWidget< unknown >;
	index: number;
}

/**
 * Per-instance wrapper. Currently a minimal slot that provides widget
 * identity via context and hosts `WidgetRender`. Chrome (header, remove,
 * badges, error UI, loading overlay) is tracked separately and extends this
 * compound without changing the public signature.
 */
export const Widget = forwardRef< HTMLDivElement, WidgetProps >(
	function Widget( { widget, index }, ref ) {
		const { widgetTypes, editMode } = useDashboardInternalContext();
		const widgetType = widgetTypes.find( ( t ) => t.name === widget.type );

		const contextValue = useMemo(
			() => ( {
				uuid: widget.uuid,
				name: widget.type,
				index,
			} ),
			[ widget.uuid, widget.type, index ]
		);

		if ( ! widgetType ) {
			return null;
		}

		return (
			<WidgetContextProvider value={ contextValue }>
				<Card.Root
					className={ styles[ 'widget-chrome-container' ] }
					{ ...( editMode ? { inert: '' } : {} ) }
					ref={ ref }
				>
					<Card.Header>
						<Card.Title>{ widgetType.title }</Card.Title>
					</Card.Header>

					<Card.Content>
						<WidgetRender
							widget={ widget }
							widgetType={ widgetType }
						/>
					</Card.Content>
				</Card.Root>
			</WidgetContextProvider>
		);
	}
);
