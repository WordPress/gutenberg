/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { CSSProperties } from 'react';

/**
 * Internal dependencies
 */
import type { Props as SurfaceProps } from '../surface/types';

export type CardProps = SurfaceProps & {
	/**
	 * Size of the elevation shadow, based on the Style system's elevation system.
	 * Elevating a `Card` can be done by adjusting the `elevation` prop. This may be helpful in highlighting certain content. For more information, check out `Elevation`.
	 *
	 * @example
	 * ```jsx
	 * import { Card, CardBody, Text } from `@wordpress/components/ui`
	 *
	 * function Example() {
	 *   return (
	 *     <Card elevation={ 8 }>
	 *       <CardBody>
	 *         <Text>Card Content</Text>
	 *       </CardBody>
	 *     </Card>
	 *   );
	 * }
	 *```
	 */
	elevation?: number;
	/**
	 * Renders without a border.
	 *
	 * @default false
	 */
	isBorderless?: boolean;
	/**
	 * Renders with rounded corners.
	 *
	 * @default true
	 */
	isRounded?: boolean;
};

export type CardBodyProps = {
	/**
	 * Determines if `CardBody` is scrollable.
	 *
	 * @default true
	 */
	scrollable?: boolean;
	/**
	 * The children elements.
	 */
	children: React.ReactNode;
};

export type CardHeaderSize = 'medium' | 'small' | 'xSmall';

export type CardHeaderProps = {
	/**
	 * Determines the size of `CardHeader`.
	 *
	 * @default 'medium'
	 */
	size?: CardHeaderSize;
	/**
	 * The children elements.
	 */
	children: React.ReactNode;
};

export type CardFooterProps = CardHeaderProps & {
	justify: CSSProperties[ 'justifyContent' ];
};
