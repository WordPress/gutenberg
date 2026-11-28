import type { ComponentType } from 'react';
import { ColorPalette } from '@wordpress/components';
import withColorContext from './with-color-context';
import type { WithColorContextProps } from './types';

// The palette takes the colors the context passes.
export default withColorContext(
	ColorPalette as unknown as ComponentType< WithColorContextProps >
);
