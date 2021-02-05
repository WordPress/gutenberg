import { CSSProperties } from 'react';
import { HStackAlignment, Props as HStackProps } from '../h-stack/types';

export type Props = HStackProps & {
	/**
	 * @example
	 *```jsx
	 * function Example() {
	 *   return (
	 *     <VStack alignment="center">
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
	 *```
	 */
	alignment?: HStackAlignment | CSSProperties[ 'alignItems' ];
	/**
	 * @example
	 * ```jsx
	 * function Example() {
	 *   return (
	 *     <VStack alignment="center" spacing={8}>
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
	 *```
	 */
	spacing?: CSSProperties[ 'width' ];
};
