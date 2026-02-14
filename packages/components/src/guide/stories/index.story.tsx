/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react-vite';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../../button';
import Guide from '..';

const meta: Meta< typeof Guide > = {
	title: 'Components/Guide',
	component: Guide,
	argTypes: {
		contentLabel: { control: 'text' },
		finishButtonText: { control: 'text' },
		nextButtonText: { control: 'text' },
		previousButtonText: { control: 'text' },
		onFinish: { action: 'onFinish' },
	},
	parameters: {
		componentStatus: {
			status: 'stable',
			whereUsed: 'editor',
		},
	},
};
export default meta;

const Template: StoryFn< typeof Guide > = ( { onFinish, ...props } ) => {
	const [ isOpen, setOpen ] = useState( false );

	const openGuide = () => setOpen( true );
	const closeGuide = () => setOpen( false );

	return (
		<>
			<Button
				__next40pxDefaultSize
				variant="secondary"
				onClick={ openGuide }
			>
				Open Guide
			</Button>
			{ isOpen && (
				<Guide
					{ ...props }
					onFinish={ ( ...finishArgs ) => {
						closeGuide();
						onFinish?.( ...finishArgs );
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
