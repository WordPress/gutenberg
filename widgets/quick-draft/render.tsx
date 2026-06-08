/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { autop } from '@wordpress/autop';
import { store as coreDataStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	DataForm,
	useFormValidity,
	type Field,
	type Form,
} from '@wordpress/dataviews';
import { useMemo, useState } from '@wordpress/element';
import { escapeHTML } from '@wordpress/escape-html';
import { __ } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { Button, Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { DraftsList, SavedPost } from './components';
import { QuickDraftContentField } from './fields';
import { useWidgetSize } from './hooks';
import styles from './style.module.css';

/*
 * Serializes plain text into one or more `core/paragraph` blocks so the saved
 * draft opens in the editor as proper blocks instead of a Classic-block
 * fallback. `autop` handles paragraph splitting and `<br>` conversion (same
 * algorithm as PHP's `wpautop`); we wrap each `<p>` in block delimiters
 * because `rawHandler` from `@wordpress/blocks` would need
 * `@wordpress/block-library` registered at runtime, which the dashboard
 * surface does not load.
 */
function textToParagraphBlocks( text: string ): string {
	if ( ! text.trim() ) {
		return '';
	}
	return autop( escapeHTML( text ) ).replace(
		/<p>([\s\S]*?)<\/p>/g,
		'<!-- wp:paragraph -->\n<p>$1</p>\n<!-- /wp:paragraph -->'
	);
}

type QuickDraftData = {
	title: string;
	content: string;
};

const FORM: Form = {
	layout: { type: 'regular' },
	fields: [ 'title', 'content' ],
};

const INITIAL_DATA: QuickDraftData = {
	title: '',
	content: '',
};

/**
 * Quick Draft widget. Lets the user draft a post (title + content) without
 * leaving the dashboard, and adapts to its own tile size: at compact sizes it
 * shows the form plus a link (when drafts exist) that reveals the recent
 * drafts in place; when the tile is wide it places the drafts list beside the
 * form, and when it is tall it stacks the list underneath. The drafts request
 * only runs when the list is actually shown, since `DraftsList` mounts only
 * then.
 */
export default function QuickDraft() {
	const [ data, setData ] = useState< QuickDraftData >( INITIAL_DATA );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ createdPost, setCreatedPost ] = useState< {
		id: number;
		title: string;
	} | null >( null );
	const [ isListOpenInCompact, setIsListOpenInCompact ] = useState( false );

	const { ref, isWide, isTall } = useWidgetSize();

	/*
	 * Whether there is room to show the drafts list inline, and how to place it.
	 * A wide tile sets the list beside the form (each column scrolls, so width
	 * is what it needs, not height); a tall but narrow tile stacks it below. A
	 * tile that is neither wide nor tall stays compact, reaching the list from a
	 * button in the form's action row that only shows when drafts exist.
	 */
	const showDraftsList = isWide || isTall;
	const listBeside = isWide;

	const { saveEntityRecord } = useDispatch( coreDataStore );

	/*
	 * The "Draft posts" reveal only shows in compact mode, so check whether any
	 * drafts exist (site-wide, as DraftsList lists them) only there. One record
	 * is enough to know the list is non-empty.
	 */
	const { hasDrafts } = useSelect(
		( select ) => {
			if ( showDraftsList ) {
				return { hasDrafts: false };
			}
			const { getEntityRecords } = select( coreDataStore );
			const anyDrafts = getEntityRecords( 'postType', 'post', {
				status: 'draft',
				per_page: 1,
			} ) as Array< { id: number } > | undefined;
			return { hasDrafts: ( anyDrafts?.length ?? 0 ) > 0 };
		},
		[ showDraftsList ]
	);

	const fields = useMemo< Field< QuickDraftData >[] >(
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
				Edit: QuickDraftContentField,
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
				content: textToParagraphBlocks( data.content ),
				status: 'draft',
			} );
			const newId = ( saved as { id?: number } | null )?.id;
			if ( typeof newId === 'number' ) {
				setCreatedPost( { id: newId, title: data.title } );
			}
			setData( INITIAL_DATA );
		} finally {
			setIsSaving( false );
		}
	};

	const writeAnother = () => {
		setCreatedPost( null );
	};

	/*
	 * The most relevant state for the tile: the post-save confirmation or the
	 * form. Composed with the drafts list according to the room the tile has.
	 */
	let primary: ReactNode;
	if ( createdPost !== null ) {
		primary = (
			<SavedPost
				postId={ createdPost.id }
				postTitle={ createdPost.title }
				onWriteAnother={ writeAnother }
			/>
		);
	} else {
		primary = (
			<Stack
				direction="column"
				gap="md"
				justify="space-between"
				className={ styles.fill }
			>
				<Stack direction="column" className={ styles.formContainer }>
					<DataForm< QuickDraftData >
						data={ data }
						fields={ fields }
						form={ FORM }
						validity={ validity }
						onChange={ ( edits ) =>
							setData( ( prev ) => ( { ...prev, ...edits } ) )
						}
					/>
				</Stack>

				<Stack direction="row" gap="md" justify="flex-start">
					<Button
						variant="solid"
						onClick={ saveDraftPost }
						loading={ isSaving }
						disabled={ ! canSave }
					>
						{ __( 'Save as draft' ) }
					</Button>
					{ ! showDraftsList && hasDrafts && (
						<Button
							variant="minimal"
							onClick={ () => setIsListOpenInCompact( true ) }
						>
							{ __( 'Draft posts' ) }
							<Button.Icon icon={ chevronRight } />
						</Button>
					) }
				</Stack>
			</Stack>
		);
	}

	// No room for the list inline, but it was revealed in place from compact.
	if ( ! showDraftsList && isListOpenInCompact ) {
		return (
			<Stack ref={ ref } direction="column" className={ styles.body }>
				<Stack direction="column" className={ styles.listPane }>
					<DraftsList />
				</Stack>
				<Stack
					direction="row"
					justify="flex-start"
					className={ styles.backRow }
				>
					<Button
						variant="minimal"
						tone="neutral"
						size="compact"
						onClick={ () => setIsListOpenInCompact( false ) }
					>
						<Button.Icon icon={ chevronLeft } />
						{ __( 'Back' ) }
					</Button>
				</Stack>
			</Stack>
		);
	}

	// Compact tile: just the primary pane; drafts are reached from the action row.
	if ( ! showDraftsList ) {
		return (
			<Stack ref={ ref } direction="column" className={ styles.body }>
				<Stack direction="column" className={ styles.primaryPane }>
					{ primary }
				</Stack>
			</Stack>
		);
	}

	// Room for the list: beside the form when wide, otherwise stacked below.
	return (
		<Stack
			ref={ ref }
			direction={ listBeside ? 'row' : 'column' }
			className={ clsx(
				styles.body,
				listBeside ? styles.row : styles.column
			) }
		>
			<Stack direction="column" className={ styles.primaryPane }>
				{ primary }
			</Stack>

			<Stack direction="column" className={ styles.listPane }>
				<DraftsList />
			</Stack>
		</Stack>
	);
}
