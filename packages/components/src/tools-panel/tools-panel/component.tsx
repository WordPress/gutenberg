/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import ToolsPanelHeader from '../tools-panel-header';
import { ToolsPanelContext } from '../context';
import { useToolsPanel } from './hook';
import { Grid } from '../../grid';
import { contextConnect, WordPressComponentProps } from '../../ui/context';
import type { ToolsPanelProps } from '../types';

const ToolsPanel = (
	props: WordPressComponentProps< ToolsPanelProps, 'div' >,
	forwardedRef: ForwardedRef< any >
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
		<Grid { ...toolsPanelProps } columns={ 2 } ref={ forwardedRef }>
			<ToolsPanelContext.Provider value={ panelContext }>
				<ToolsPanelHeader
					label={ label }
					resetAll={ resetAllItems }
					toggleItem={ toggleItem }
				/>
				{ children }
			</ToolsPanelContext.Provider>
		</Grid>
	);
};

const ConnectedToolsPanel = contextConnect( ToolsPanel, 'ToolsPanel' );

export default ConnectedToolsPanel;
