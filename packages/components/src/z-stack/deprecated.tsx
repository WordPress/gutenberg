import type { ForwardedRef } from 'react';
import deprecated from '@wordpress/deprecated';
import type { WordPressComponentProps } from '../context';
import { contextConnect } from '../context';
import { UnconnectedZStack } from './component';
import type { ZStackProps } from './types';

function UnconnectedDeprecatedZStack(
	props: WordPressComponentProps< ZStackProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	deprecated( 'wp.components.__experimentalZStack', {
		since: '7.2',
		version: '7.4',
	} );

	return UnconnectedZStack( props, forwardedRef );
}

/**
 * `ZStack` allows you to stack things along the Z-axis.
 *
 * This component is deprecated. Write your own CSS instead.
 *
 * @deprecated
 *
 * ```jsx
 * import { __experimentalZStack as ZStack } from '@wordpress/components';
 *
 * function Example() {
 *   return (
 *     <ZStack offset={ 20 } isLayered>
 *       <ExampleImage />
 *       <ExampleImage />
 *       <ExampleImage />
 *     </ZStack>
 *   );
 * }
 * ```
 */
const DeprecatedZStack = contextConnect(
	UnconnectedDeprecatedZStack,
	'ZStack'
);

export default DeprecatedZStack;
