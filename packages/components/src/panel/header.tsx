/**
 * Internal dependencies
 */
import type { PanelHeaderProps } from './types';

/**
 * `PanelHeader` renders the header for the `Panel`.
 * This is used by the `Panel` component under the hood,
 * so it does not typically need to be used.
 */
function PanelHeader( { label, children }: PanelHeaderProps ) {
	return (
		<div className="components-panel__header">
			{ label && <h2>{ label }</h2> }
			{ children }
		</div>
	);
}

export default PanelHeader;
