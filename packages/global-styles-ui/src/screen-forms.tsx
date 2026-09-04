import { __ } from '@wordpress/i18n';
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import { button, chevronUpDown, formInput } from '@wordpress/icons';
import { ScreenHeader } from './screen-header';
import { NavigationButtonAsItem } from './navigation-button';

const FORM_ELEMENTS = [
	{
		icon: formInput,
		label: __( 'Inputs' ),
		path: '/blocks/elements/form-controls/textInput',
	},
	{
		icon: chevronUpDown,
		label: __( 'Selects' ),
		path: '/blocks/elements/form-controls/select',
	},
	{
		icon: button,
		label: __( 'Buttons' ),
		path: '/blocks/elements/form-controls/button',
	},
];

function ScreenForms() {
	return (
		<>
			<ScreenHeader
				title={ __( 'Form controls' ) }
				description={ __(
					'Customize the appearance of the inputs, selects, and buttons used across the site.'
				) }
			/>
			<ItemGroup>
				{ FORM_ELEMENTS.map( ( { icon, label, path } ) => (
					<NavigationButtonAsItem
						key={ path }
						icon={ icon }
						path={ path }
					>
						{ label }
					</NavigationButtonAsItem>
				) ) }
			</ItemGroup>
		</>
	);
}

export default ScreenForms;
