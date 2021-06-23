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
					<PlaceholderControl
						hasValue={ () => !! height }
						label="Height"
						onDeselect={ () => setHeight( undefined ) }
						value={ height }
						onChange={ ( next ) => setHeight( next ) }
					/>
					<PlaceholderControl
						hasValue={ () => !! width }
						label="Width"
						onDeselect={ () => setWidth( undefined ) }
						value={ width }
						onChange={ ( next ) => setWidth( next ) }
					/>
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
	max-width: 232px;
	font-size: 13px;
`;
