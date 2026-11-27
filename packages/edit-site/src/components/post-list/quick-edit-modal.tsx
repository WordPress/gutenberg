import { __ } from '@wordpress/i18n';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import type { Post } from '@wordpress/core-data';
import { DataForm } from '@wordpress/dataviews';
import type { Field, Form } from '@wordpress/dataviews';
import {
	Button,
	Modal,
	Popover as WCPopover,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import {
	createPortal,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { unlock } from '../../lock-unlock';

const { usePostFields, PostCardPanel } = unlock( editorPrivateApis );

const fieldsWithBulkEditSupport = [ 'status', 'date', 'author', 'discussion' ];

type FieldSetValue = ( args: {
	item: any;
	value: any;
} ) => Record< string, any >;

/**
 * The values picked in a bulk edit form, by field id, in the order they were
 * last picked, with the `setValue` of their field.
 */
type PickedValues = Map< string, { value: unknown; setValue: FieldSetValue } >;

/*
 * DataForm's default `setValue`, for a field without its own: the value under
 * the field id, nested for a dotted id.
 */
const setValueFromId =
	( id: string ): FieldSetValue =>
	( { value } ) => {
		const path = id.split( '.' );
		const edits: Record< string, any > = {};
		let current = edits;
		for ( const segment of path.slice( 0, -1 ) ) {
			current[ segment ] = {};
			current = current[ segment ];
		}
		current[ path[ path.length - 1 ] ] = value;
		return edits;
	};

/*
 * A bulk edit shows no post, so each field picks its value against the form's
 * own edits, and a field whose `setValue` depends on the post can't apply what
 * the value means for each one (the status field drops the date in the future
 * of a scheduled post and the password of a private one). Note every value
 * the form picks, so the save can run its field's `setValue` again against
 * each post.
 */
function withPickedValue< F extends { id: string; setValue?: FieldSetValue } >(
	field: F,
	pickedValues: PickedValues
): F {
	const setValue = field.setValue ?? setValueFromId( field.id );
	return {
		...field,
		setValue: ( args: { item: any; value: any } ) => {
			// A field picked again moves last, so the picks replay in the
			// order they were last made.
			pickedValues.delete( field.id );
			pickedValues.set( field.id, { value: args.value, setValue } );
			return setValue( args );
		},
	};
}

/*
 * The edits a bulk edit makes to one post: the values picked in the form, in
 * order, each turned into edits by its field against the post as the earlier
 * picks leave it, as if the post had been edited alone.
 */
function replayPickedValues(
	pickedValues: PickedValues,
	post: Record< string, any >
) {
	let edits: Record< string, any > = {};
	for ( const { value, setValue } of pickedValues.values() ) {
		edits = {
			...edits,
			...setValue( { item: { ...post, ...edits }, value } ),
		};
	}
	return edits;
}

interface QuickEditModalProps {
	postType: string;
	postId: string[];
	closeModal: () => void;
	/** Called once the edits are saved, before the modal closes. */
	onSave?: () => void;
	quickEditForm: Form | undefined;
}

export function QuickEditModal( {
	postType,
	postId,
	closeModal,
	onSave: onSaved,
	quickEditForm,
}: QuickEditModalProps ) {
	const isBulk = postId.length > 1;

	const [ modalElement, setModalElement ] = useState< HTMLDivElement | null >(
		null
	);
	const [ localEdits, setLocalEdits ] = useState< Partial< Post > >( {} );
	const { record, hasFinishedResolution } = useSelect(
		( select ) => {
			const {
				getEditedEntityRecord,
				hasFinishedResolution: hasFinished,
			} = select( coreDataStore );

			if ( isBulk ) {
				return {
					record: null,
					hasFinishedResolution: true,
				};
			}

			const args: [ string, string, string ] = [
				'postType',
				postType,
				postId[ 0 ],
			];

			return {
				record: getEditedEntityRecord( ...args ),
				hasFinishedResolution: hasFinished(
					'getEditedEntityRecord',
					args
				),
			};
		},
		[ postType, postId, isBulk ]
	);
	const { editEntityRecord, saveEditedEntityRecord } =
		useDispatch( coreDataStore );
	const registry = useRegistry();
	const pickedValues = useRef< PickedValues >( new Map() );

	const fields = usePostFields( { postType } );

	// In a bulk edit, note the values the form picks: see `withPickedValue`.
	const formFields = useMemo(
		() =>
			isBulk
				? fields?.map( ( field: Field< Post > ) =>
						withPickedValue( field, pickedValues.current )
					)
				: fields,
		[ fields, isBulk ]
	);

	const form = useMemo( (): Form => {
		if ( ! quickEditForm ) {
			return { layout: { type: 'panel' }, fields: [] };
		}
		if ( ! isBulk ) {
			return quickEditForm;
		}
		return {
			...quickEditForm,
			fields: ( quickEditForm.fields ?? [] ).filter( ( field ) =>
				fieldsWithBulkEditSupport.includes(
					typeof field === 'string' ? field : field.id
				)
			),
		};
	}, [ isBulk, quickEditForm ] );

	const onChange = ( edits: Record< string, any > ) => {
		setLocalEdits( ( prev ) => ( { ...prev, ...edits } ) );
	};
	useEffect( () => {
		setLocalEdits( {} );
		pickedValues.current.clear();
	}, [ postId ] );

	const getEditsFor = async ( id: string ) => {
		if ( ! isBulk ) {
			return localEdits;
		}
		const post = await registry
			.resolveSelect( coreDataStore )
			.getEditedEntityRecord( 'postType', postType, id )
			// Without the post there's nothing to replay the picks against,
			// and its save reports the error.
			.catch( () => undefined );
		if ( ! post ) {
			return localEdits;
		}
		return replayPickedValues( pickedValues.current, post );
	};

	const onSave = async () => {
		const edits = await Promise.all( postId.map( getEditsFor ) );
		postId.forEach( ( id, index ) => {
			editEntityRecord( 'postType', postType, id, edits[ index ] );
		} );

		if ( isBulk ) {
			await Promise.allSettled(
				postId.map( ( id ) =>
					saveEditedEntityRecord( 'postType', postType, id )
				)
			);
		} else {
			await saveEditedEntityRecord( 'postType', postType, postId[ 0 ] );
		}
		onSaved?.();
		closeModal?.();
	};

	return (
		<Modal
			ref={ setModalElement }
			size="small"
			overlayClassName="dataviews-action-modal__quick-edit"
			__experimentalHideHeader
			onRequestClose={ closeModal }
			focusOnMount="firstElement"
		>
			<div className="dataviews-action-modal__quick-edit-header">
				<PostCardPanel
					postType={ postType }
					postId={ postId }
					hideActions
				/>
			</div>
			<div className="dataviews-action-modal__quick-edit-content">
				{ hasFinishedResolution && (
					<DataForm
						data={ { ...record, ...localEdits } }
						fields={ formFields }
						form={ form }
						onChange={ onChange }
					/>
				) }
			</div>
			<HStack className="dataviews-action-modal__quick-edit-footer">
				<Button
					__next40pxDefaultSize
					variant="secondary"
					onClick={ closeModal }
				>
					{ __( 'Cancel' ) }
				</Button>
				<Button
					__next40pxDefaultSize
					variant="primary"
					onClick={ onSave }
				>
					{ __( 'Done' ) }
				</Button>
			</HStack>
			{ modalElement &&
				// Keep popovers inside modal isolation but outside the clipped frame.
				createPortal( <WCPopover.Slot />, modalElement ) }
		</Modal>
	);
}
