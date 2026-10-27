import type { ForwardedRef } from 'react';
import { useToolsPanelItem } from './hook';
import { View } from '../../view';
import type { WordPressComponentProps } from '../../context';
import { contextConnect } from '../../context';
import type { PrivateToolsPanelItemProps, ToolsPanelItemProps } from '../types';

// This wraps controls to be conditionally displayed within a tools panel. It
// prevents props being applied to HTML elements that would make them invalid.
const UnconnectedToolsPanelItem = (
	props: WordPressComponentProps<
		ToolsPanelItemProps & PrivateToolsPanelItemProps,
		'div'
	>,
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

export const ToolsPanelItem = contextConnect(
	UnconnectedToolsPanelItem,
	'ToolsPanelItem'
);

/**
 * `ToolsPanelItem` with the private `isInherited` prop, available through the
 * package's private APIs.
 */
export const PrivateToolsPanelItem = ToolsPanelItem as typeof ToolsPanelItem &
	( (
		props: WordPressComponentProps<
			ToolsPanelItemProps & PrivateToolsPanelItemProps,
			'div'
		> & { ref?: ForwardedRef< any > }
	) => ReturnType< typeof UnconnectedToolsPanelItem > );

export default ToolsPanelItem;
