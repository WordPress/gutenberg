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
import ProgressiveDisclosurePanel from '../';
import ProgressiveDisclosurePanelItem from '../item';
import Panel from '../../panel';
import UnitControl from '../../unit-control';

export default {
	title: 'Components/ProgressiveDisclosurePanel',
	component: ProgressiveDisclosurePanel,
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
				<ProgressiveDisclosurePanel
					label="Display options"
					title="Progressive Disclosure Panel"
					resetAll={ resetAll }
				>
					<ProgressiveDisclosurePanelItem
						hasValue={ () => !! height }
						label="Height"
						onDeselect={ () => setHeight( undefined ) }
					>
						<PlaceholderControl
							label="Height"
							value={ height }
							onChange={ ( next ) => setHeight( next ) }
						/>
					</ProgressiveDisclosurePanelItem>
					<ProgressiveDisclosurePanelItem
						hasValue={ () => !! width }
						label="Width"
						onDeselect={ () => setWidth( undefined ) }
					>
						<PlaceholderControl
							label="Width"
							value={ width }
							onChange={ ( next ) => setWidth( next ) }
						/>
					</ProgressiveDisclosurePanelItem>
				</ProgressiveDisclosurePanel>
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
