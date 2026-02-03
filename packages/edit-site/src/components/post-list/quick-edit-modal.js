/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import { DataForm } from '@wordpress/dataviews';
import {
	Button,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import usePatternSettings from '../page-patterns/use-pattern-settings';

const { usePostFields, PostCardPanel } = unlock( editorPrivateApis );

export function QuickEditModal( { postType, postId, closeModal } ) {
	const { record, hasFinishedResolution } = useSelect(
		( select ) => {
			const args = [ 'postType', postType, postId ];
			const {
				getEditedEntityRecord,
				hasFinishedResolution: hasFinished,
			} = select( coreDataStore );

			return {
				record: getEditedEntityRecord( ...args ),
				hasFinishedResolution: hasFinished(
					'getEditedEntityRecord',
					args
				),
			};
		},
		[ postType, postId ]
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

	const form = useMemo(
		() => ( {
			layout: {
				type: 'panel',
			},
			fields: [
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
			],
		} ),
		[]
	);

	const onChange = ( edits ) => {
		if (
			edits.status &&
			edits.status !== 'future' &&
			record?.status === 'future' &&
			new Date( record.date ) > new Date()
		) {
			edits.date = null;
		}
		if ( edits.status && edits.status === 'private' && record.password ) {
			edits.password = '';
		}
		editEntityRecord( 'postType', postType, postId, edits );
	};

	const onSave = async () => {
		await saveEditedEntityRecord( 'postType', postType, postId );
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
		<VStack spacing={ 4 }>
			<PostCardPanel postType={ postType } postId={ postId } />
			{ hasFinishedResolution && (
				<DataForm
					data={ record }
					fields={ fieldsWithDependency }
					form={ form }
					onChange={ onChange }
				/>
			) }
			<HStack justify="right">
				<Button
					__next40pxDefaultSize
					variant="tertiary"
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
		</VStack>
	);
}
