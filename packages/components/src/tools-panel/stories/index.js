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
	title: 'Components/ToolsPanel',
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
						hasValue={ () => !! height }
						label="Height"
						onDeselect={ () => setHeight( undefined ) }
					>
						<PlaceholderControl
							label="Height"
							value={ height }
							onChange={ ( next ) => setHeight( next ) }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						hasValue={ () => !! width }
						label="Width"
						onDeselect={ () => setWidth( undefined ) }
					>
						<PlaceholderControl
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

function PlaceholderControl( { label, value, onChange } ) {
	return (
		<UnitControl label={ label } value={ value } onChange={ onChange } />
	);
}

const PanelWrapperView = styled.div`
	max-width: 250px;
	font-size: 13px;
`;
