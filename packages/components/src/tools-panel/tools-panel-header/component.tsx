/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { HStack } from '../../h-stack';
import { Heading } from '../../heading';
import { useToolsPanelHeader } from './hook';
import { contextConnect, WordPressComponentProps } from '../../ui/context';
import type { ToolsPanelHeaderProps } from '../types';
import ToolsPanelDropdownMenu from '../tools-panel-dropdown-menu';

const ToolsPanelHeader = (
	props: WordPressComponentProps< ToolsPanelHeaderProps, 'h2' >,
	forwardedRef: ForwardedRef< any >
) => {
	const { headingClassName, label, resetAll, toggleItem, ...headerProps } =
		useToolsPanelHeader( props );

	if ( ! label ) {
		return null;
	}

	const dropDownMenuLabelText = sprintf(
		// translators: %s: The name of the tool e.g. "Color" or "Typography".
		_x( '%s options', 'Button label to reveal tool panel options' ),
		label
	);

	return (
		<HStack { ...headerProps } ref={ forwardedRef }>
			<Heading level={ 2 } className={ headingClassName }>
				{ label }
			</Heading>
			<ToolsPanelDropdownMenu
				label={ dropDownMenuLabelText }
				resetAll={ resetAll }
				toggleItem={ toggleItem }
			/>
		</HStack>
	);
};

const ConnectedToolsPanelHeader = contextConnect(
	ToolsPanelHeader,
	'ToolsPanelHeader'
);

export default ConnectedToolsPanelHeader;
