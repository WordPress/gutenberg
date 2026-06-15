/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../../context';
import type { ToolbarGroupContainerProps } from './types';

const ToolbarGroupContainer = ( {
	className,
	children,
	...props
}: WordPressComponentProps< ToolbarGroupContainerProps, 'div', false > ) => (
	<div className={ className } { ...props }>
		{ children }
	</div>
);
export default ToolbarGroupContainer;
