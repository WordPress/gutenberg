/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { COLORS, CONFIG } from '../utils';
import { space } from '../ui/utils/space';

export const ToolsPanel = css`
	border-top: ${ CONFIG.borderWidth } solid ${ COLORS.gray[ 200 ] };
	column-gap: ${ space( 4 ) };
	display: grid;
	grid-template-columns: 1fr 1fr;
	margin-top: -1px;
	padding: ${ space( 4 ) };
	row-gap: ${ space( 6 ) };
`;

export const ToolsPanelHeader = css`
	align-items: center;
	display: flex;
	font-size: inherit;
	font-weight: 500;
	grid-column: span 2;
	justify-content: space-between;
	line-height: normal;

	.components-tools-panel & {
		margin: 0;
	}

	.components-dropdown-menu {
		margin-top: ${ space( -1 ) };
		margin-bottom: ${ space( -1 ) };
		height: ${ space( 6 ) };
	}

	.components-dropdown-menu__toggle {
		padding: 0;
		height: ${ space( 6 ) };
		min-width: ${ space( 6 ) };
		width: ${ space( 6 ) };
	}
`;

export const ToolsPanelItem = css`
	grid-column: span 2;

	&.single-column {
		grid-column: span 1;
	}

	/* Clear spacing in and around controls added as panel items. */
	/* Remove when they can be addressed via context system. */
	& > div,
	& > fieldset {
		padding-bottom: 0;
		margin-bottom: 0;
		max-width: 100%;
	}
`;

export const DropdownMenu = css`
	min-width: 200px;
`;
