/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type { SpaceInput } from '../ui/utils/space';

export type SpacerProps = {
	/**
	 * The children elements.
	 */
	children?: ReactNode;
	/**
	 * Adjusts all margins.
	 */
	margin?: SpaceInput;
	/**
	 * Adjusts bottom margin, potentially overriding the value from the more
	 * generic `margin` and `marginY` props.
	 *
	 * @default 2
	 */
	marginBottom?: SpaceInput;
	/**
	 * Adjusts left margin, potentially overriding the value from the more
	 * generic `margin` and `marginX` props.
	 */
	marginLeft?: SpaceInput;
	/**
	 * Adjusts right margin, potentially overriding the value from the more
	 * generic `margin` and `marginX` props.
	 */
	marginRight?: SpaceInput;
	/**
	 * Adjusts top margin, potentially overriding the value from the more
	 * generic `margin` and `marginY` props.
	 */
	marginTop?: SpaceInput;
	/**
	 * Adjusts left and right margins, potentially overriding the value from the
	 * more generic `margin` prop.
	 */
	marginX?: SpaceInput;
	/**
	 * Adjusts top and bottom margins, potentially overriding the value from the
	 * more generic `margin` prop.
	 */
	marginY?: SpaceInput;
	/**
	 * Adjusts all padding.
	 */
	padding?: SpaceInput;
	/**
	 * Adjusts bottom padding, potentially overriding the value from the more
	 * generic `padding` and `paddingY` props.
	 */
	paddingBottom?: SpaceInput;
	/**
	 * Adjusts left padding, potentially overriding the value from the more
	 * generic `padding` and `paddingX` props.
	 */
	paddingLeft?: SpaceInput;
	/**
	 * Adjusts right padding, potentially overriding the value from the more
	 * generic `padding` and `paddingX` props.
	 */
	paddingRight?: SpaceInput;
	/**
	 * Adjusts top padding, potentially overriding the value from the more
	 * generic `padding` and `paddingY` props.
	 */
	paddingTop?: SpaceInput;
	/**
	 * Adjusts left and right padding, potentially overriding the value from the
	 * more generic `padding` prop.
	 */
	paddingX?: SpaceInput;
	/**
	 * Adjusts top and bottom padding, potentially overriding the value from the
	 * more generic `padding` prop.
	 */
	paddingY?: SpaceInput;
};
