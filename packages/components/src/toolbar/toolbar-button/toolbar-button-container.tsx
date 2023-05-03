/**
 * Internal dependencies
 */
import type { ToolbarButtonContainerProps } from './types';

const ToolbarButtonContainer = ( {
	children,
	className,
}: ToolbarButtonContainerProps ) => (
	<div className={ className }>{ children }</div>
);

export default ToolbarButtonContainer;
