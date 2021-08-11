/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ToolsPanel, ToolsPanelItem } from '../';
import Panel from '../../panel';
import UnitControl from '../../unit-control';

export default {
	title: 'Components (Experimental)/ToolsPanel',
	component: ToolsPanel,
};

export const _default = () => {
	const [ height, setHeight ] = useState();
	const [ width, setWidth ] = useState();

	const resetAll = () => {
		setHeight( undefined );
		setWidth( undefined );
	};

	return (
		<PanelWrapperView>
			<Panel>
				<ToolsPanel
					header="Tools Panel"
					label="Display options"
					resetAll={ resetAll }
				>
					<ToolsPanelItem
						className="single-column"
						hasValue={ () => !! height }
						label="Height"
						onDeselect={ () => setHeight( undefined ) }
					>
						<UnitControl
							label="Height"
							value={ height }
							onChange={ ( next ) => setHeight( next ) }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						className="single-column"
						hasValue={ () => !! width }
						label="Width"
						onDeselect={ () => setWidth( undefined ) }
					>
						<UnitControl
							label="Width"
							value={ width }
							onChange={ ( next ) => setWidth( next ) }
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</Panel>
		</PanelWrapperView>
	);
};

const PanelWrapperView = styled.div`
	max-width: 250px;
	font-size: 13px;
`;
