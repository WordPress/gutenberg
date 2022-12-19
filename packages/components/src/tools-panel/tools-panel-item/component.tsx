/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import { useToolsPanelItem } from './hook';
import { View } from '../../view';
import { contextConnect, WordPressComponentProps } from '../../ui/context';
import type { ToolsPanelItemProps } from '../types';

// This wraps controls to be conditionally displayed within a tools panel. It
// prevents props being applied to HTML elements that would make them invalid.
const ToolsPanelItem = (
	props: WordPressComponentProps< ToolsPanelItemProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) => {
	const {
		children,
		isShown,
		shouldRenderPlaceholder,
		...toolsPanelItemProps
	} = useToolsPanelItem( props );

	if ( ! isShown ) {
		return shouldRenderPlaceholder ? (
			<View { ...toolsPanelItemProps } ref={ forwardedRef } />
		) : null;
	}

	return (
		<View { ...toolsPanelItemProps } ref={ forwardedRef }>
			{ children }
		</View>
	);
};

const ConnectedToolsPanelItem = contextConnect(
	ToolsPanelItem,
	'ToolsPanelItem'
);

export default ConnectedToolsPanelItem;
