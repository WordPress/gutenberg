import { createElement, createRoot } from '@wordpress/element';
import { Tooltip } from '@wordpress/ui';

createRoot( document.getElementById( 'theme-compatibility' ) ).render(
	createElement(
		Tooltip.Root,
		null,
		createElement( Tooltip.Trigger, null, 'Show theme tooltip' ),
		createElement( Tooltip.Popup, null, 'Theme compatibility works' )
	)
);
