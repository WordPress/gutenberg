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

const components = [
	{ name: 'button', label: 'Button', readme: buttonReadme },
	{ name: 'button-group', label: 'Button Group', readme: buttonGroupReadme },
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
