import type { ForwardedRef } from 'react';
import { useMemo } from '@wordpress/element';
import type { WordPressComponentProps } from '../../context';
import { contextConnect, ContextSystemProvider } from '../../context';
import { Elevation } from '../../elevation';
import { View } from '../../view';
import styles from '../style.module.scss';
import { useCard } from './hook';
import type { Props } from '../types';

function UnconnectedCard(
	props: WordPressComponentProps< Props, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	const {
		children,
		elevation,
		isBorderless,
		isRounded,
		size,
		...otherProps
	} = useCard( props );

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
			<View { ...otherProps } ref={ forwardedRef }>
				<View className={ styles.content }>{ children }</View>
				<Elevation
					isInteractive={ false }
					value={ elevation ? 1 : 0 }
				/>
				<Elevation isInteractive={ false } value={ elevation } />
			</View>
		</ContextSystemProvider>
	);
}

/**
 * `Card` provides a flexible and extensible content container.
 * `Card` also provides a convenient set of sub-components such as `CardBody`,
 * `CardHeader`, `CardFooter`, and more.
 *
 * ```jsx
 * import {
 *   Card,
 *   CardHeader,
 *   CardBody,
 *   CardFooter,
 *   __experimentalText as Text,
 *   __experimentalHeading as Heading,
 * } from `@wordpress/components`;
 *
 * function Example() {
 *   return (
 *     <Card>
 *       <CardHeader>
 *         <Heading level={ 4 }>Card Title</Heading>
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
export const Card = contextConnect( UnconnectedCard, 'Card' );

export default Card;
