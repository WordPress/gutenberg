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

const UnconnectedToolsPanel = (
	props: WordPressComponentProps< ToolsPanelProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) => {
	const {
		children,
		label,
		panelContext,
		resetAllItems,
		toggleItem,
		headingLevel,
		...toolsPanelProps
	} = useToolsPanel( props );

	return (
		<Grid { ...toolsPanelProps } columns={ 2 } ref={ forwardedRef }>
			<ToolsPanelContext.Provider value={ panelContext }>
				<ToolsPanelHeader
					label={ label }
					resetAll={ resetAllItems }
					toggleItem={ toggleItem }
					headingLevel={ headingLevel }
				/>
				{ children }
			</ToolsPanelContext.Provider>
		</Grid>
	);
};

/**
 * The `ToolsPanel` is a container component that displays its children preceded
 * by a header. The header includes a dropdown menu which is automatically
 * generated from the panel's inner `ToolsPanelItems`.
 *
 * @example
 * ```jsx
 * import { __ } from '@wordpress/i18n';
 * import {
 *   __experimentalToolsPanel as ToolsPanel,
 *   __experimentalToolsPanelItem as ToolsPanelItem,
 *   __experimentalUnitControl as UnitControl
 * } from '@wordpress/components';
 *
 * function Example() {
 *   const [ height, setHeight ] = useState();
 *   const [ width, setWidth ] = useState();
 *
 *   const resetAll = () => {
 *     setHeight();
 *     setWidth();
 *   }
 *
 *   return (
 *     <ToolsPanel label={ __( 'Dimensions' ) } resetAll={ resetAll }>
 *       <ToolsPanelItem
 *         hasValue={ () => !! height }
 *         label={ __( 'Height' ) }
 *         onDeselect={ () => setHeight() }
 *       >
 *         <UnitControl
 *           label={ __( 'Height' ) }
 *           onChange={ setHeight }
 *           value={ height }
 *         />
 *       </ToolsPanelItem>
 *       <ToolsPanelItem
 *         hasValue={ () => !! width }
 *         label={ __( 'Width' ) }
 *         onDeselect={ () => setWidth() }
 *       >
 *         <UnitControl
 *           label={ __( 'Width' ) }
 *           onChange={ setWidth }
 *           value={ width }
 *         />
 *       </ToolsPanelItem>
 *     </ToolsPanel>
 *   );
 * }
 * ```
 */
export const ToolsPanel = contextConnect( UnconnectedToolsPanel, 'ToolsPanel' );

export default ToolsPanel;
