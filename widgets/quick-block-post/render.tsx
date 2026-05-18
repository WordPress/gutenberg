/**
 * WordPress dependencies
 */
import { store as coreDataStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { DataForm, useFormValidity } from '@wordpress/dataviews';
import type { Field, Form } from '@wordpress/dataviews';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Stack } from '@wordpress/ui'; // eslint-disable-line @wordpress/use-recommended-components

/**
 * Internal dependencies
 */
import { SavedPost } from './components';

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
	const [ createdPostId, setCreatedPostId ] = useState< number | null >(
		null
	);

	const { saveEntityRecord } = useDispatch( coreDataStore );

	const fields = useMemo< Field< QuickBlockPostData >[] >(
		() => [
			{
				id: 'title',
				type: 'text',
				label: __( 'Title' ),
				isValid: { required: true, minLength: 3 },
				hideLabelFromVision: true,
				help: __( 'Enter a title for your post.' ),
			},
			{
				id: 'content',
				type: 'text',
				label: __( 'Content' ),
				isValid: { required: true, minLength: 10 },
				Edit: { control: 'textarea', rows: 4 },
				help: __( 'Enter the content for your post.' ),
			},
		],
		[]
	);

	const { validity, isValid } = useFormValidity( data, fields, FORM );

	const canSave = isValid && ! isSaving;

	const saveDraftPost = async () => {
		if ( ! canSave ) {
			return;
		}

		setIsSaving( true );

		try {
			const saved = await saveEntityRecord( 'postType', 'post', {
				title: data.title,
				content: data.content,
				status: 'draft',
			} );
			const newId = ( saved as { id?: number } | null )?.id;
			if ( typeof newId === 'number' ) {
				setCreatedPostId( newId );
			}
			setData( INITIAL_DATA );
		} finally {
			setIsSaving( false );
		}
	};

	const writeAnother = () => {
		setCreatedPostId( null );
	};

	if ( createdPostId !== null ) {
		return (
			<SavedPost
				postId={ createdPostId }
				onWriteAnother={ writeAnother }
			/>
		);
	}

	return (
		<Stack direction="column" gap="md" justify="space-between">
			<DataForm< QuickBlockPostData >
				data={ data }
				fields={ fields }
				form={ FORM }
				validity={ validity }
				onChange={ ( edits ) =>
					setData( ( prev ) => ( { ...prev, ...edits } ) )
				}
			/>

			<Stack direction="row" gap="md" justify="flex-end">
				<Button
					variant="solid"
					onClick={ saveDraftPost }
					loading={ isSaving }
					disabled={ ! canSave }
				>
					{ __( 'Save as draft' ) }
				</Button>
			</Stack>
		</Stack>
	);
}
