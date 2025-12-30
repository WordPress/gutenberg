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
import type { WordPressComponentProps } from '../../context';
import { contextConnect } from '../../context';
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
		dropdownMenuProps,
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
					dropdownMenuProps={ dropdownMenuProps }
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
 *           __next40pxDefaultSize
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
 *           __next40pxDefaultSize
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
