/**
 * Internal dependencies
 */

import { Slot } from './slot';

import { ColorControls, TypographyControls } from './controls';

export function GlobalStylesPanel() {
	return (
		<>
			<TypographyControls />
			<ColorControls />
			<Slot />
		</>
	);
}
