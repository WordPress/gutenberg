/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { Flex } from '../../flex';
import { Grid } from '../../grid';
import { useControlGroup } from './hook';
import { contextConnect } from '../context';

/**
 * @param {import('../context').WordPressComponentProps<import('./types').Props, 'div'>} props
 * @param {import('react').ForwardedRef<any>}                                            forwardedRef
 */
function ControlGroup( props, forwardedRef ) {
	const {
		children,
		direction = 'row',
		templateColumns,
		...otherProps
	} = useControlGroup( props );

	const isGrid = !! templateColumns;

	if ( isGrid ) {
		return (
			<Grid
				gap={ 0 }
				templateColumns={ templateColumns }
				{ ...otherProps }
				ref={ forwardedRef }
			>
				{ children }
			</Grid>
		);
	}

	return (
		<Flex
			direction={ direction }
			gap={ `-1px` }
			{ ...otherProps }
			ref={ forwardedRef }
		>
			{ children }
		</Flex>
	);
}

/**
 * `ControlGroup` is a layout-based component for rendering a group of
 * control-based components, such as `Button`, `Select` or `TextInput`.
 * Control components that render within `ControlGroup` automatically
 * have their borders offset and border-radii rounded.
 *
 * @example
 * ```jsx
 * import { Button, ControlGroup, Select, TextInput } from `@wordpress/components/ui`;
 *
 * function Example() {
 *   return (
 *     <ControlGroup templateColumns="auto 1fr auto">
 *       <Select />
 *       <TextInput placeholder="First name" />
 *       <Button variant="primary" />
 *     </ControlGroup>
 *   );
 * }
 * ```
 */
const ConnectedControlGroup = contextConnect( ControlGroup, 'ControlGroup' );

export default ConnectedControlGroup;
