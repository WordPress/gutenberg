import { CSSProperties } from 'react';

import { FlexProps } from '../flex/types';

export type ControlGroupContext = {
	isFirst?: boolean;
	isLast?: boolean;
	isMidde?: boolean;
	isOnly?: boolean;
	isVertical?: boolean;
	styles?: string;
};

export type Props = Pick< FlexProps, 'direction' > & {
	/**
	 * Adjust the layout (width) of content using CSS grid (`grid-template-columns`).
	 *
	 * @example
	 * ```jsx
	 * import { Button, ControlGroup, Select, TextInput } from `@wordpress/components/ui`
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
	templateColumns?: CSSProperties[ 'gridTemplateColumns' ];
};
