/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { ComponentProps } from 'react';
import { HexColorPicker as Picker } from 'react-colorful';

/**
 * Internal dependencies
 */
import { ColorfulWrapper } from './styles';

type Props = ComponentProps< typeof Picker >;

export const HexColorPicker = ( props: Props ) => (
	<ColorfulWrapper>
		<Picker { ...props } />
	</ColorfulWrapper>
);
