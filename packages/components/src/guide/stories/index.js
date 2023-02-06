/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../../button';
import Guide from '../';

export default {
	title: 'Components/Guide',
	component: Guide,
	argTypes: {
		contentLabel: { control: 'text' },
		finishButtonText: { control: 'text' },
		onFinish: { action: 'onFinish' },
	},
};

const Template = ( { onFinish, ...props } ) => {
	const [ isOpen, setOpen ] = useState( false );

	const openGuide = () => setOpen( true );
	const closeGuide = () => setOpen( false );

	return (
		<>
			<Button variant="secondary" onClick={ openGuide }>
				Open Guide
			</Button>
			{ isOpen && (
				<Guide
					{ ...props }
					onFinish={ ( ...finishArgs ) => {
						closeGuide( ...finishArgs );
						onFinish( ...finishArgs );
					} }
				/>
			) }
		</>
	);
};

export const Default = Template.bind( {} );
Default.args = {
	pages: Array.from( { length: 3 } ).map( ( _, page ) => ( {
		content: <p>{ `Page ${ page + 1 }` }</p>,
	} ) ),
};
