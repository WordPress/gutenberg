/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';

/**
 * Internal dependencies
 */
import ToolsPanelHeader from '../tools-panel-header';
import { ToolsPanelContext } from '../context';
import { useToolsPanel } from './hook';
import { View } from '../../view';
import { contextConnect, WordPressComponentProps } from '../../ui/context';
import type { ToolsPanelProps } from '../types';

const ToolsPanel = (
	props: WordPressComponentProps< ToolsPanelProps, 'div' >,
	forwardedRef: Ref< any >
) => {
	const {
		children,
		label,
		panelContext,
		resetAllItems,
		toggleItem,
		...toolsPanelProps
	} = useToolsPanel( props );

	return (
		<View { ...toolsPanelProps } ref={ forwardedRef }>
			<ToolsPanelContext.Provider value={ panelContext }>
				<ToolsPanelHeader
					label={ label }
					resetAll={ resetAllItems }
					toggleItem={ toggleItem }
				/>
				{ children }
			</ToolsPanelContext.Provider>
		</View>
	);
};

const ConnectedToolsPanel = contextConnect( ToolsPanel, 'ToolsPanel' );

export default ConnectedToolsPanel;
