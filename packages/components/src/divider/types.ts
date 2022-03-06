/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { SeparatorProps } from 'reakit';

/**
 * Internal dependencies
 */
import type { SpaceInput } from '../ui/utils/space';

export interface OwnProps {
	/**
	 * Adjusts all margins on the inline dimension.
	 */
	margin?: SpaceInput;
	/**
	 * Adjusts the inline-start margin.
	 */
	marginStart?: SpaceInput;
	/**
	 * Adjusts the inline-end margin.
	 */
	marginEnd?: SpaceInput;
}

export interface Props
	extends Omit< SeparatorProps, 'children' | 'unstable_system' >,
		OwnProps {}
