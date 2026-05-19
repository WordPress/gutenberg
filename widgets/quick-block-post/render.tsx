/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';
import { store as coreDataStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { DataForm, useFormValidity } from '@wordpress/dataviews';
import type { Field, Form } from '@wordpress/dataviews';
import { useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { Button, Stack } from '@wordpress/ui'; // eslint-disable-line @wordpress/use-recommended-components

/**
 * Internal dependencies
 */
import { ExistingDraftPrompt, SavedPost } from './components';
import { QuickPostContentField } from './fields';
import styles from './styles.module.css';

function getTodayStartISO() {
	const now = new Date();
	const year = now.getFullYear();
	const month = String( now.getMonth() + 1 ).padStart( 2, '0' );
	const day = String( now.getDate() ).padStart( 2, '0' );
	return `${ year }-${ month }-${ day }T00:00:00`;
}

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
	const [ createdPost, setCreatedPost ] = useState< {
		id: number;
		title: string;
	} | null >( null );
	const [ hasDismissedPrompt, setHasDismissedPrompt ] = useState( false );

	const { saveEntityRecord } = useDispatch( coreDataStore );

	const { existingDraft, isLoadingDrafts } = useSelect( ( select ) => {
		const { getCurrentUser, getEntityRecords, hasFinishedResolution } =
			select( coreDataStore );
		const currentUser = getCurrentUser();

		if ( ! currentUser?.id ) {
			return { existingDraft: null, isLoadingDrafts: true };
		}

		const query = {
			status: 'draft',
			author: currentUser.id,
			after: getTodayStartISO(),
			orderby: 'date',
			order: 'desc',
			per_page: 1,
		};
		const records = getEntityRecords( 'postType', 'post', query ) as
			| Array< { id: number; title: { rendered: string } } >
			| undefined;

		return {
			existingDraft: records?.[ 0 ] ?? null,
			isLoadingDrafts: ! hasFinishedResolution( 'getEntityRecords', [
				'postType',
				'post',
				query,
			] ),
		};
	}, [] );

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
				Edit: QuickPostContentField,
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
				setCreatedPost( { id: newId, title: data.title } );
			}
			setData( INITIAL_DATA );
			setHasDismissedPrompt( true );
		} finally {
			setIsSaving( false );
		}
	};

	const writeAnother = () => {
		setCreatedPost( null );
	};

	if ( isLoadingDrafts ) {
		return (
			<Stack
				direction="column"
				align="center"
				justify="center"
				className={ styles.body }
			>
				<Spinner />
			</Stack>
		);
	}

	if ( existingDraft && ! hasDismissedPrompt ) {
		return (
			<ExistingDraftPrompt
				postId={ existingDraft.id }
				postTitle={ decodeEntities( existingDraft.title.rendered ) }
				onWriteAnother={ () => setHasDismissedPrompt( true ) }
			/>
		);
	}

	if ( createdPost !== null ) {
		return (
			<SavedPost
				postId={ createdPost.id }
				postTitle={ createdPost.title }
				onWriteAnother={ writeAnother }
			/>
		);
	}

	return (
		<Stack
			direction="column"
			gap="md"
			justify="space-between"
			className={ styles.body }
		>
			<Stack className={ styles.formContainer }>
				<DataForm< QuickBlockPostData >
					data={ data }
					fields={ fields }
					form={ FORM }
					validity={ validity }
					onChange={ ( edits ) =>
						setData( ( prev ) => ( { ...prev, ...edits } ) )
					}
				/>
			</Stack>

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
