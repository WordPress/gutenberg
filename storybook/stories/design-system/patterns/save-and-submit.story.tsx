import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Card, CardBody } from '@wordpress/components';
import { DataForm } from '@wordpress/dataviews';
import { useState } from '@wordpress/element';

const LayoutCardSaveExample = () => {
	const [ data, setData ] = useState( { title: '' } );

	return (
		<div style={ { maxWidth: '480px' } }>
			<Card
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
					>
						Save
					</Button>
				</CardBody>
			</Card>
		</div>
	);
};

const meta: Meta< typeof LayoutCardSaveExample > = {
	title: 'Design System/Patterns/Save & Submit',
	component: LayoutCardSaveExample,
	parameters: {
		controls: { disable: true },
	},
	tags: [ '!dev' /* Hide individual story pages from sidebar */ ],
};

export default meta;

type Story = StoryObj< typeof LayoutCardSaveExample >;

export const SaveFormLayoutCard: Story = {
	name: 'Save form layout card',
	render: () => <LayoutCardSaveExample />,
};
