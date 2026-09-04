import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import {
	button,
	caption,
	heading,
	link,
	quote,
	settings,
	typography,
} from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { NavigationButtonAsItem } from './navigation-button';
import { ScreenBody } from './screen-body';
import { ScreenHeader } from './screen-header';

const ELEMENTS = [
	{ icon: button, label: __( 'Buttons' ), path: '/elements/button' },
	{ icon: link, label: __( 'Links' ), path: '/elements/link' },
	{
		icon: settings,
		label: __( 'Form controls' ),
		path: '/elements/form-controls',
	},
	{ icon: typography, label: __( 'Text' ), path: '/elements/text' },
	{ icon: heading, label: __( 'Headings' ), path: '/elements/heading' },
	{ icon: caption, label: __( 'Captions' ), path: '/elements/caption' },
	{ icon: quote, label: __( 'Citations' ), path: '/elements/cite' },
];

function ScreenElements() {
	return (
		<>
			<ScreenHeader
				title={ __( 'Elements' ) }
				description={ __(
					'Customize the appearance of text, buttons, links, and form controls for the whole site.'
				) }
			/>
			<ScreenBody>
				<ItemGroup>
					{ ELEMENTS.map( ( { icon, label, path } ) => (
						<NavigationButtonAsItem
							key={ path }
							icon={ icon }
							path={ path }
						>
							{ label }
						</NavigationButtonAsItem>
					) ) }
				</ItemGroup>
			</ScreenBody>
		</>
	);
}

export default ScreenElements;
