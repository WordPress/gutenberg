/**
 * Internal dependencies
 */
import { createComponent } from '../utils';
import { useVStack } from './use-v-stack';

/**
 * `VStack` (or Vertical Stack) is a layout component that arranges child elements in a vertical line.
 *
 * `VStack` can render anything inside.
 *
 * @example
 * ```jsx
 * function Example() {
 *   return (
 *     <VStack css={ [ ui.frame.height( 200 ) ] }>
 *       <View css={ [ ui.background.blue ] }>
 *         <Text>Ana</Text>
 *       </View>
 *       <View css={ [ ui.background.blue ] }>
 *         <Text>Elsa</Text>
 *       </View>
 *       <View css={ [ ui.background.blue ] }>
 *         <Text>Olaf</Text>
 *       </View>
 *     </VStack>
 *   );
 * }
 * ```
 */
const VStack = createComponent( {
	as: 'div',
	useHook: useVStack,
	name: 'VStack',
} );

export default VStack;
