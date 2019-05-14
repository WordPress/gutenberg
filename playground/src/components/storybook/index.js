/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import buttonReadme from '../../../../packages/components/src/button/README.md';
import buttonGroupReadme from '../../../../packages/components/src/button-group/README.md';

import checkboxControlReadme from '../../../../packages/components/src/checkbox-control/README.md';
import radioControlReadme from '../../../../packages/components/src/radio-control/README.md';
import rangeControlReadme from '../../../../packages/components/src/range-control/README.md';
import selectControlReadme from '../../../../packages/components/src/select-control/README.md';
import textControlReadme from '../../../../packages/components/src/text-control/README.md';
import toggleControlReadme from '../../../../packages/components/src/toggle-control/README.md';

import dropdownReadme from '../../../../packages/components/src/dropdown/README.md';
import dropdownMenuReadme from '../../../../packages/components/src/dropdown-menu/README.md';

import menuGroupReadme from '../../../../packages/components/src/menu-group/README.md';
// import menuItemReadme from '../../../../packages/components/src/menu-item/README.md';
import menuItemsChoiceReadme from '../../../../packages/components/src/menu-items-choice/README.md';

const components = [
	{ name: 'button', label: 'Button', readme: buttonReadme },
	{ name: 'button-group', label: 'Button Group', readme: buttonGroupReadme },

	{ name: 'checkbox-control', label: 'Checkbox Control', readme: checkboxControlReadme },
	{ name: 'radio-control', label: 'Radio Control', readme: radioControlReadme },
	{ name: 'range-control', label: 'Range Control', readme: rangeControlReadme },
	{ name: 'select-control', label: 'Select Control', readme: selectControlReadme },
	{ name: 'text-control', label: 'Text Control', readme: textControlReadme },
	{ name: 'toggle-control', label: 'Toggle Control', readme: toggleControlReadme },

	{ name: 'dropdown', label: 'Dropdown', readme: dropdownReadme },
	{ name: 'dropdown-menu', label: 'Dropdown Menu', readme: dropdownMenuReadme },

	{ name: 'menu-group', label: 'Menu Group', readme: menuGroupReadme },
	//	{ name: 'menu-item', label: 'Menu Item', readme: menuItemReadme },
	{ name: 'menu-items-choice', label: 'Menu Items Choice', readme: menuItemsChoiceReadme },
];

function Storybook() {
	const [ component, updateComponent ] = useState( 'button' );
	const activeComponent = components.find( ( comp ) => comp.name === component );

	return (
		<div className="storybook">
			<div className="storybook__sidebar">
				<div className="storybook_menu">
					{ components.map( ( { name, label } ) => (
						<div key={ name }>
							<Button
								isToggled={ component === name }
								onClick={ () => updateComponent( name ) }
							>
								{ label }
							</Button>
						</div>
					) ) }
				</div>
			</div>
			<div className="storybook__body">
				<div dangerouslySetInnerHTML={ { __html: activeComponent.readme } } />
			</div>
		</div>
	);
}

export default Storybook;
