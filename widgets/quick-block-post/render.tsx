/**
 * WordPress dependencies
 */
import { store as coreDataStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { DataForm } from '@wordpress/dataviews';
import type { Field, Form } from '@wordpress/dataviews';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack, Button } from '@wordpress/ui'; // eslint-disable-line @wordpress/use-recommended-components

type QuickBlockPostData = {
	title: string;
	content: string;
};

const FORM: Form = {
	layout: { type: 'regular' },
	fields: [ 'title', 'content' ],
};

const INITIAL_DATA: QuickBlockPostData = {
	title: '',
	content: '',
};

export default function QuickBlockPost() {
	const [ data, setData ] = useState< QuickBlockPostData >( INITIAL_DATA );
	const [ isSaving, setIsSaving ] = useState( false );

	const { saveEntityRecord } = useDispatch( coreDataStore );

	const fields = useMemo< Field< QuickBlockPostData >[] >(
		() => [
			{
				id: 'title',
				type: 'text',
				label: __( 'Title' ),
				required: true,
				hideLabelFromVision: true,
				help: __( 'Enter a title for your post.' ),
			},
			{
				id: 'content',
				type: 'text',
				label: __( 'Content' ),
				required: true,
				Edit: { control: 'textarea', rows: 4 },
				help: __( 'Enter the content for your post.' ),
			},
		],
		[]
	);

	const canSave = data.title.trim().length > 0 && ! isSaving;

	const handleSaveDraft = async () => {
		if ( ! canSave ) {
			return;
		}

		setIsSaving( true );

		try {
			await saveEntityRecord( 'postType', 'post', {
				title: data.title,
				content: data.content,
				status: 'draft',
			} );
			setData( INITIAL_DATA );
		} finally {
			setIsSaving( false );
		}
	};

	return (
		<Stack direction="column" gap="md">
			<DataForm< QuickBlockPostData >
				data={ data }
				fields={ fields }
				form={ FORM }
				onChange={ ( edits ) =>
					setData( ( prev ) => ( { ...prev, ...edits } ) )
				}
			/>
			<Stack direction="row" gap="md" justify="flex-end">
				<Button
					variant="solid"
					onClick={ handleSaveDraft }
					loading={ isSaving }
					disabled={ ! canSave }
				>
					{ __( 'Save as draft' ) }
				</Button>
			</Stack>
		</Stack>
	);
}
