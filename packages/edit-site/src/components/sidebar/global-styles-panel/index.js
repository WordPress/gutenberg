/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { GlobalStylesStateProvider } from './store';

import { Panel } from '@wordpress/components';

import {
	ColorPanel,
	HeadingPanel,
	QuotePanel,
	TypographyPanel,
} from './panels';

export default function GlobalStylesPanel() {
	return (
		<GlobalStylesStateProvider>
			<Panel header={ __( 'Global Styles' ) }>
				<TypographyPanel />
				<ColorPanel />
				<HeadingPanel />
				<QuotePanel />
			</Panel>
		</GlobalStylesStateProvider>
	);
}
