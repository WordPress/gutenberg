/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import { DataForm } from '@wordpress/dataviews';
import {
	Button,
	Modal,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import usePatternSettings from '../page-patterns/use-pattern-settings';

const { usePostFields, PostCardPanel } = unlock( editorPrivateApis );

const fieldsWithBulkEditSupport = [ 'status', 'date', 'author', 'discussion' ];

export function QuickEditModal( { postType, postId, closeModal } ) {
	// Before calling the onRequestClose callback, the modal introduces a animation delay
	// that produces a visual glitch, see https://github.com/WordPress/gutenberg/pull/75173#pullrequestreview-3755585506
	// Handling the ESC key and click-outside ourselves fixes it.
	useEffect( () => {
		const handleKeyDown = ( event ) => {
			if ( event.key === 'Escape' || event.code === 'Escape' ) {
				event.preventDefault();
				event.stopPropagation();
				closeModal?.();
			}
		};

		const handleClickOutside = ( event ) => {
			if (
				event.target.classList.contains(
					'dataviews-action-modal__quick-edit'
				)
			) {
				closeModal?.();
			}
		};
		document.addEventListener( 'keydown', handleKeyDown );
		document.addEventListener( 'mousedown', handleClickOutside );
		return () => {
			document.removeEventListener( 'keydown', handleKeyDown );
			document.removeEventListener( 'mousedown', handleClickOutside );
		};
	}, [ closeModal ] );

	const isBulk = postId.length > 1;

	const [ localEdits, setLocalEdits ] = useState( {} );
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

			const args = [ 'postType', postType, postId[ 0 ] ];
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

	const _fields = usePostFields( { postType } );
	const fields = useMemo(
		() =>
			_fields?.map( ( field ) => {
				if ( field.id === 'status' ) {
					return {
						...field,
						elements: field.elements.filter(
							( element ) => element.value !== 'trash'
						),
					};
				}
				return field;
			} ),
		[ _fields ]
	);

	const form = useMemo( () => {
		const allFields = [
			{
				id: 'featured_media',
				layout: {
					type: 'regular',
					labelPosition: 'none',
				},
			},
			{
				id: 'status',
				label: __( 'Status & Visibility' ),
				children: [ 'status', 'password' ],
			},
			'author',
			'date',
			'slug',
			'parent',
			{
				id: 'discussion',
				label: __( 'Discussion' ),
				children: [ 'comment_status', 'ping_status' ],
			},
			{
				label: __( 'Template' ),
				id: 'template',
				layout: {
					type: 'regular',
					labelPosition: 'side',
				},
			},
		];

		return {
			layout: {
				type: 'panel',
			},
			fields: isBulk
				? allFields.filter( ( field ) =>
						fieldsWithBulkEditSupport.includes(
							typeof field === 'string' ? field : field.id
						)
				  )
				: allFields,
		};
	}, [ isBulk ] );

	const onChange = ( edits ) => {
		const currentData = { ...record, ...localEdits };

		if (
			edits.status &&
			edits.status !== 'future' &&
			currentData?.status === 'future' &&
			new Date( currentData.date ) > new Date()
		) {
			edits.date = null;
		}
		if (
			edits.status &&
			edits.status === 'private' &&
			currentData?.password
		) {
			edits.password = '';
		}

		setLocalEdits( ( prev ) => ( { ...prev, ...edits } ) );
	};
	useEffect( () => {
		setLocalEdits( {} );
	}, [ postId ] );

	const onSave = async () => {
		for ( const id of postId ) {
			editEntityRecord( 'postType', postType, id, localEdits );
		}

		if ( isBulk ) {
			await Promise.allSettled(
				postId.map( ( id ) =>
					saveEditedEntityRecord( 'postType', postType, id )
				)
			);
		} else {
			await saveEditedEntityRecord( 'postType', postType, postId[ 0 ] );
		}
		closeModal?.();
	};

	const { ExperimentalBlockEditorProvider } = unlock(
		blockEditorPrivateApis
	);
	const settings = usePatternSettings();

	/**
	 * The template field depends on the block editor settings.
	 * This is a workaround to ensure that the block editor settings are available.
	 * For more information, see: https://github.com/WordPress/gutenberg/issues/67521
	 */
	const fieldsWithDependency = useMemo( () => {
		return fields.map( ( field ) => {
			if ( field.id === 'template' ) {
				return {
					...field,
					Edit: ( data ) => (
						<ExperimentalBlockEditorProvider settings={ settings }>
							<field.Edit { ...data } />
						</ExperimentalBlockEditorProvider>
					),
				};
			}
			return field;
		} );
	}, [ fields, settings ] );

	return (
		<Modal
			overlayClassName="dataviews-action-modal__quick-edit"
			__experimentalHideHeader
			shouldCloseOnEsc={ false }
			shouldCloseOnClickOutside={ false }
		>
			<div className="dataviews-action-modal__quick-edit-header">
				<PostCardPanel
					postType={ postType }
					postId={ postId }
					onClose={ closeModal }
					hideActions
				/>
			</div>
			<div className="dataviews-action-modal__quick-edit-content">
				{ hasFinishedResolution && (
					<DataForm
						data={ { ...record, ...localEdits } }
						fields={ fieldsWithDependency }
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
		</Modal>
	);
}
