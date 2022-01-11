/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type { SpaceInput } from '../ui/utils/space';

export type Props = {
	/**
	 * Adjusts all margins.
	 */
	margin?: SpaceInput;
	/**
	 * Adjusts top and bottom margins.
	 */
	marginY?: SpaceInput;
	/**
	 * Adjusts left and right margins.
	 */
	marginX?: SpaceInput;
	/**
	 * Adjusts top margins.
	 */
	marginTop?: SpaceInput;
	/**
	 * Adjusts bottom margins.
	 *
	 * @default 2
	 */
	marginBottom?: SpaceInput;
	/**
	 * Adjusts left margins.
	 */
	marginLeft?: SpaceInput;
	/**
	 * Adjusts right margins.
	 */
	marginRight?: SpaceInput;
	/**
	 * Adjusts all padding.
	 */
	padding?: SpaceInput;
	/**
	 * Adjusts top and bottom padding.
	 */
	paddingY?: SpaceInput;
	/**
	 * Adjusts left and right padding.
	 */
	paddingX?: SpaceInput;
	/**
	 * Adjusts top padding.
	 */
	paddingTop?: SpaceInput;
	/**
	 * Adjusts bottom padding.
	 */
	paddingBottom?: SpaceInput;
	/**
	 * Adjusts left padding.
	 */
	paddingLeft?: SpaceInput;
	/**
	 * Adjusts right padding.
	 */
	paddingRight?: SpaceInput;
	/**
	 * The children elements.
	 */
	children?: ReactNode;
};
