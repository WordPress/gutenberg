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
	 * Adjusts all margins.
	 */
	margin?: SpaceInput;
	/**
	 * Adjusts top margins.
	 */
	marginTop?: SpaceInput;
	/**
	 * Adjusts bottom margins.
	 */
	marginBottom?: SpaceInput;
}

export interface Props extends Omit< SeparatorProps, 'children' >, OwnProps {}
