/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { contextConnect, ContextSystemProvider } from '../../ui/context';
import { Elevation } from '../../elevation';
import { CardView, CardContentView } from '../styles';
import { useCard } from './hook';

/**
 * @param {import('../../ui/context').PolymorphicComponentProps<import('../types').Props, 'div'>} props
 * @param {import('react').Ref<any>}                                                              forwardedRef
 */
function Card( props, forwardedRef ) {
	const { children, elevation, isBorderless, size, ...otherProps } = useCard(
		props
	);
	const contextProviderValue = useMemo( () => {
		const contextProps = {
			size,
			isBorderless,
		};
		return {
			CardBody: contextProps,
			CardHeader: contextProps,
			CardFooter: contextProps,
		};
	}, [ isBorderless, size ] );

	return (
		<ContextSystemProvider value={ contextProviderValue }>
			<CardView
				isBorderless={ isBorderless }
				{ ...otherProps }
				ref={ forwardedRef }
			>
				<CardContentView>{ children }</CardContentView>
				<Elevation
					isInteractive={ false }
					value={ elevation ? 1 : 0 }
				/>
				<Elevation isInteractive={ false } value={ elevation } />
			</CardView>
		</ContextSystemProvider>
	);
}

/**
 * `Card` provides a flexible and extensible content container.
 * `Card` also provides a convenient set of sub-components such as `CardBody`,
 * `CardHeader`, `CardFooter`, and more.
 *
 * @example
 * ```jsx
 * import {
 *   Card,
 *   CardHeader,
 *   CardBody,
 *   CardFooter,
 *   Text,
 *   Heading,
 * } from `@wordpress/components`;
 *
 * function Example() {
 *   return (
 *     <Card>
 *       <CardHeader>
 *         <Heading size={ 4 }>Card Title</Heading>
 *       </CardHeader>
 *       <CardBody>
 *         <Text>Card Content</Text>
 *       </CardBody>
 *       <CardFooter>
 *         <Text>Card Footer</Text>
 *       </CardFooter>
 *     </Card>
 *   );
 * }
 * ```
 */
const ConnectedCard = contextConnect( Card, 'Card' );

export default ConnectedCard;
