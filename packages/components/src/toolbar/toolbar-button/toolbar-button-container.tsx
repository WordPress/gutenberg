/**
 * Internal dependencies
 */
import type { ToolbarButtonContainerProps } from './types';
import type { WordPressComponentProps } from '../../ui/context';

const ToolbarButtonContainer = ( {
	className,
	children,
}: ToolbarButtonContainerProps ) => (
	<div className={ className }>{ children }</div>
);

export default ToolbarButtonContainer;
