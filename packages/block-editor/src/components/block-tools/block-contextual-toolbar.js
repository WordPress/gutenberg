/**
 * Internal dependencies
 */
import BlockToolbar from '../block-toolbar';

export default function BlockContextualToolbar( {
	focusOnMount,
	isFixed,
	...props
} ) {
	return (
		<BlockToolbar
			focusOnMount={ focusOnMount }
			hideDragHandle={ isFixed }
			isFixed={ isFixed }
			{ ...props }
		/>
	);
}
