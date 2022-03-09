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

interface SeparatorPropsWithAdditionalDescription {
	/**
	 * Divider's orientation. When using inside a flex container, you may need to make sure the divider is `stretch` aligned
	 * in order for it to be visible.
	 *
	 * @default 'horizontal'
	 */
	orientation?: SeparatorProps[ 'orientation' ];
}

export interface Props
	extends Omit<
			SeparatorProps,
			'children' | 'unstable_system' | 'orientation'
		>,
		SeparatorPropsWithAdditionalDescription,
		OwnProps {}
