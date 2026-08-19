import { Button } from '@wordpress/components';
import { useMemo, useState } from '@wordpress/element';
import DataForm from '../index';
import type { Field, Form } from '../../types';

type InteractivePanelItem = {
	title: string;
};

const form: Form = {
	layout: { type: 'panel', openAs: 'dropdown' },
	fields: [
		{
			id: 'details',
			label: 'Details',
			layout: {
				type: 'panel',
				openAs: 'dropdown',
				summary: [ 'summaryAction' ],
			},
			children: [ 'title' ],
		},
	],
};

const InteractivePanelSummaryComponent = () => {
	const [ item, setItem ] = useState< InteractivePanelItem >( {
		title: 'Hello world',
	} );
	const [ activationCount, setActivationCount ] = useState( 0 );
	const fields = useMemo< Field< InteractivePanelItem >[] >(
		() => [
			{
				id: 'title',
				type: 'text',
				label: 'Title',
			},
			{
				id: 'summaryAction',
				type: 'text',
				label: 'Summary action',
				render: () => (
					<Button
						variant="link"
						onClick={ () =>
							setActivationCount( ( count ) => count + 1 )
						}
					>
						Summary action
					</Button>
				),
			},
		],
		[]
	);

	return (
		<>
			<DataForm< InteractivePanelItem >
				data={ item }
				fields={ fields }
				form={ form }
				onChange={ ( edits ) =>
					setItem( ( previousItem ) => ( {
						...previousItem,
						...edits,
					} ) )
				}
			/>
			<div role="status">Summary activations: { activationCount }</div>
		</>
	);
};

export default InteractivePanelSummaryComponent;
