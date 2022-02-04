/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { contextConnect, ContextSystemProvider } from '../../ui/context';
import { Elevation } from '../../elevation';
import { View } from '../../view';
import * as styles from '../styles';
import { useCard } from './hook';
import CONFIG from '../../utils/config-values';
import { useCx } from '../../utils/hooks/use-cx';

/**
 * @param {import('../../ui/context').WordPressComponentProps<import('../types').Props, 'div'>} props
 * @param {import('react').Ref<any>}                                                            forwardedRef
 */
function Card( props, forwardedRef ) {
	const {
		children,
		elevation,
		isBorderless,
		isRounded,
		size,
		...otherProps
	} = useCard( props );
	const elevationBorderRadius = isRounded ? CONFIG.cardBorderRadius : 0;

	const cx = useCx();

	const elevationClassName = useMemo(
		() => cx( css( { borderRadius: elevationBorderRadius } ) ),
		[ cx, elevationBorderRadius ]
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
			<View { ...otherProps } ref={ forwardedRef }>
				<View className={ cx( styles.Content ) }>{ children }</View>
				<Elevation
					className={ elevationClassName }
					isInteractive={ false }
					value={ elevation ? 1 : 0 }
				/>
				<Elevation
					className={ elevationClassName }
					isInteractive={ false }
					value={ elevation }
				/>
			</View>
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
