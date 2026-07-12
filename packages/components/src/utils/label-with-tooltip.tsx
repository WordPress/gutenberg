/**
 * External dependencies
 */
import type { ReactElement, ReactNode } from 'react';
import { Tooltip } from '@wordpress/ui';

type LabelWithTooltipProps = {
	/**
	 * Tooltip text shown when hovering/focusing the label. When omitted the
	 * label content is rendered unchanged.
	 */
	labelTooltip?: string;
	/**
	 * The label content to (optionally) wrap in a tooltip anchor.
	 */
	children: ReactNode;
};

/**
 * Wraps label content in a `Tooltip` anchor when `labelTooltip` is provided,
 * otherwise returns the children untouched.
 *
 * Shared by the control label primitives (`BaseControl`,
 * `BaseControl.VisualLabel`, `InputControl`) so the `labelTooltip` prop renders
 * a consistent, natively-anchored tooltip on the visible label text — no
 * portals. Uses the `@wordpress/ui` `Tooltip` so it matches tooltips wrapped
 * manually elsewhere (e.g. the Global Styles inheritance breadcrumb labels).
 *
 * @param props
 * @param props.labelTooltip Tooltip text.
 * @param props.children     Label content.
 */
export function LabelWithTooltip( {
	labelTooltip,
	children,
}: LabelWithTooltipProps ): ReactElement {
	if ( ! labelTooltip ) {
		return <>{ children }</>;
	}

	return (
		<Tooltip.Root>
			<Tooltip.Trigger
				render={
					<span className="components-control-label__tooltip-anchor">
						{ children }
					</span>
				}
			/>
			<Tooltip.Popup>
				{ labelTooltip.split( '\n' ).map( ( line, index ) => (
					// Render each breadcrumb segment on its own line.
					<span key={ index } style={ { display: 'block' } }>
						{ line }
					</span>
				) ) }
			</Tooltip.Popup>
		</Tooltip.Root>
	);
}
