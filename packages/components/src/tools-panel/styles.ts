/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import {
	StyledField as BaseControlField,
	StyledHelp as BaseControlHelp,
	StyledLabel as BaseControlLabel,
	Wrapper as BaseControlWrapper,
} from '../base-control/styles/base-control-styles';
import { LabelWrapper } from '../input-control/styles/input-control-styles';
import { COLORS, CONFIG } from '../utils';
import { space } from '../ui/utils/space';

const toolsPanelGrid = {
	spacing: css`
		column-gap: ${ space( 4 ) };
		row-gap: ${ space( 6 ) };
	`,
	item: {
		fullWidth: css`
			grid-column: 1 / -1;
		`,
	},
};

export const ToolsPanel = css`
	${ toolsPanelGrid.spacing };

	border-top: ${ CONFIG.borderWidth } solid ${ COLORS.gray[ 300 ] };
	margin-top: -1px;
	padding: ${ space( 4 ) };
`;

/**
 * Items injected into a ToolsPanel via a virtual bubbling slot will require
 * an inner dom element to be injected. The following rule allows for the
 * CSS grid display to be re-established.
 */

export const ToolsPanelWithInnerWrapper = ( columns: number ) => {
	return css`
		> div:not( :first-of-type ) {
			display: grid;
			grid-template-columns: ${ `repeat( ${ columns }, 1fr )` };
			${ toolsPanelGrid.spacing }
			${ toolsPanelGrid.item.fullWidth }
		}
	`;
};

export const ToolsPanelHiddenInnerWrapper = css`
	> div:not( :first-of-type ) {
		display: none;
	}
`;

export const ToolsPanelHeader = css`
	${ toolsPanelGrid.item.fullWidth }
	gap: ${ space( 2 ) };

	/**
	 * The targeting of dropdown menu component classes here is a temporary
	 * measure only.
	 *
	 * The following styles should be replaced once the DropdownMenu has been
	 * refactored and can be targeted via component interpolation.
	 */
	.components-dropdown-menu {
		margin: ${ space( -1 ) } 0;
		line-height: 0;
	}
	&&&& .components-dropdown-menu__toggle {
		padding: 0;
		min-width: ${ space( 6 ) };
	}
`;

export const ToolsPanelHeading = css`
	font-size: inherit;
	font-weight: 500;
	line-height: normal;

	/* Required to meet specificity requirements to ensure zero margin */
	&& {
		margin: 0;
	}
`;

export const ToolsPanelItem = css`
	${ toolsPanelGrid.item.fullWidth }

	/* Clear spacing in and around controls added as panel items. */
	/* Remove when they can be addressed via context system. */
	& > div,
	& > fieldset {
		padding-bottom: 0;
		margin-bottom: 0;
		max-width: 100%;
	}

	/* Remove BaseControl components margins and leave spacing to grid layout */
	&& ${ BaseControlWrapper } {
		margin-bottom: 0;

		/**
		 * To maintain proper spacing within a base control, the field's bottom
		 * margin should only be removed when there is no help text included and
		 * it is therefore the last-child.
		 */
		${ BaseControlField }:last-child {
			margin-bottom: 0;
		}
	}

	${ BaseControlHelp } {
		margin-bottom: 0;
	}

	/**
	 * Standardize InputControl and BaseControl labels with other labels when
	 * inside ToolsPanel.
	 *
	 * This is a temporary fix until the different control components have their
	 * labels normalized.
	 */
	&& ${ LabelWrapper } {
		label {
			line-height: 1.4em;
		}
	}

	/**
	 * The targeting of .components-custom-select-control__label here is a
	 * temporary measure only.
	 *
	 * It should be replaced once CustomSelectControl component has been
	 * refactored and can be targeted via component interpolation.
	 */
	.components-custom-select-control__label,
	${ BaseControlLabel } {
		line-height: 1.4em;
	}
`;

export const ToolsPanelItemPlaceholder = css`
	display: none;
`;

export const DropdownMenu = css`
	min-width: 200px;
`;
