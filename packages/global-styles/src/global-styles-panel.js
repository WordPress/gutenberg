/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */

import { Panel } from '@wordpress/components';
import { Slot } from './slot';

import { ColorPanel, TypographyPanel } from './panels';

export function GlobalStylesPanel() {
	return (
		<Panel header={ __( 'Global Styles' ) }>
			<TypographyPanel />
			<ColorPanel />
			<Slot />
		</Panel>
	);
}
