/**
 * WordPress dependencies
 */
import { useId, useMemo } from '@wordpress/element';
import { Card } from '@wordpress/ui';
import type { WidgetType } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { WidgetContextProvider } from '../../context/widget-context';
import { WidgetFrame } from '../widget-frame';
import styles from './widget-preview-chrome.module.css';
import type { DashboardWidget } from '../../types';

export interface WidgetPreviewChromeProps {
	widget: DashboardWidget< unknown >;
	widgetType: WidgetType;
	index?: number;
}

/**
 * Catalog host-chrome: the faithful `WidgetFrame` in a viewport that scales the
 * card to fill the tile at any zoom; inert so the picker owns selection.
 *
 * @param {WidgetPreviewChromeProps} props Component props.
 */
export function WidgetPreviewChrome( {
	widget,
	widgetType,
	index = 0,
}: WidgetPreviewChromeProps ) {
	const titleId = useId();

	const contextValue = useMemo(
		() => ( {
			uuid: widget.uuid,
			name: widget.type,
			index,
		} ),
		[ widget.uuid, widget.type, index ]
	);

	return (
		<WidgetContextProvider value={ contextValue }>
			<div className={ styles.viewport } { ...{ inert: '' } }>
				<div className={ styles.canvas }>
					<Card.Root
						render={ <section /> }
						className={ styles.card }
						aria-labelledby={
							widgetType.title ? titleId : undefined
						}
					>
						<WidgetFrame
							widget={ widget }
							widgetType={ widgetType }
							titleId={ titleId }
						/>
					</Card.Root>
				</div>
			</div>
		</WidgetContextProvider>
	);
}
