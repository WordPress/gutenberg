import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Card as WCCard, CardBody } from '@wordpress/components';
import { DataForm } from '@wordpress/dataviews';
import { useState } from '@wordpress/element';

const meta: Meta = {
	title: 'Design System/Patterns/Save & Submit',
	parameters: {
		controls: { disable: true },
	},
	tags: [ 'docs-only' ],
};

export default meta;

type Story = StoryObj;

export const SaveFormLayoutCard: Story = {
	name: 'Save form layout card',
	render() {
		const [ data, setData ] = useState( { title: '' } );

		return (
			<div style={ { maxWidth: '480px' } }>
				<WCCard
					size={ {
						blockStart: 'medium',
						blockEnd: 'medium',
						inlineStart: 'medium',
						inlineEnd: 'medium',
					} }
				>
					<CardBody>
						<DataForm
							data={ data }
							fields={ [
								{
									id: 'title',
									label: 'Title',
									type: 'text',
								},
							] }
							form={ {
								layout: { type: 'regular' },
								fields: [ 'title' ],
							} }
							onChange={ ( edits ) =>
								setData( ( previous ) => ( {
									...previous,
									...edits,
								} ) )
							}
						/>
						<Button
							variant="primary"
							isBusy
							style={ { marginTop: '16px' } }
							__next40pxDefaultSize
						>
							Save
						</Button>
					</CardBody>
				</WCCard>
			</div>
		);
	},
};
