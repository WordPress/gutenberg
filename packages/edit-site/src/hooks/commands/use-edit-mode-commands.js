/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { __, sprintf, isRTL } from '@wordpress/i18n';
import {
	trash,
	rotateLeft,
	rotateRight,
	layout,
	page,
	plus,
} from '@wordpress/icons';
import { useCommandLoader, store as commandsStore } from '@wordpress/commands';
import { decodeEntities } from '@wordpress/html-entities';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import useEditedEntityRecord from '../../components/use-edited-entity-record';
import isTemplateRemovable from '../../utils/is-template-removable';
import isTemplateRevertable from '../../utils/is-template-revertable';
import { unlock } from '../../lock-unlock';
import { TEMPLATE_POST_TYPE } from '../../utils/constants';
import { useLink } from '../../components/routes/link';

const { useHistory } = unlock( routerPrivateApis );

function usePageContentFocusCommands() {
	const { record: template } = useEditedEntityRecord();
	const { isPage, canvasMode, templateId, currentPostType } = useSelect(
		( select ) => {
			const { isPage: _isPage, getCanvasMode } = unlock(
				select( editSiteStore )
			);
			const { getCurrentPostType, getCurrentTemplateId } =
				select( editorStore );
			return {
				isPage: _isPage(),
				canvasMode: getCanvasMode(),
				templateId: getCurrentTemplateId(),
				currentPostType: getCurrentPostType(),
			};
		},
		[]
	);

	const { onClick: editTemplate } = useLink( {
		postType: 'wp_template',
		postId: templateId,
	} );

	const { setRenderingMode } = useDispatch( editorStore );

	if ( ! isPage || canvasMode !== 'edit' ) {
		return { isLoading: false, commands: [] };
	}

	const commands = [];

	if ( currentPostType !== 'wp_template' ) {
		commands.push( {
			name: 'core/switch-to-template-focus',
			label: sprintf(
				/* translators: %s: template title */
				__( 'Edit template: %s' ),
				decodeEntities( template.title )
			),
			icon: layout,
			callback: ( { close } ) => {
				editTemplate();
				close();
			},
		} );
	} else {
		commands.push( {
			name: 'core/switch-to-page-focus',
			label: __( 'Back to page' ),
			icon: page,
			callback: ( { close } ) => {
				setRenderingMode( 'template-locked' );
				close();
			},
		} );
	}

	return { isLoading: false, commands };
}

function useManipulateDocumentCommands() {
	const { isLoaded, record: template } = useEditedEntityRecord();
	const { removeTemplate, revertTemplate } = useDispatch( editSiteStore );
	const history = useHistory();
	const isEditingPage = useSelect(
		( select ) =>
			select( editSiteStore ).isPage() &&
			select( editorStore ).getCurrentPostType() !== 'wp_template',
		[]
	);

	if ( ! isLoaded ) {
		return { isLoading: true, commands: [] };
	}

	const commands = [];

	if ( isTemplateRevertable( template ) && ! isEditingPage ) {
		const label =
			template.type === TEMPLATE_POST_TYPE
				? sprintf(
						/* translators: %s: template title */
						__( 'Reset template: %s' ),
						decodeEntities( template.title )
				  )
				: sprintf(
						/* translators: %s: template part title */
						__( 'Reset template part: %s' ),
						decodeEntities( template.title )
				  );
		commands.push( {
			name: 'core/reset-template',
			label,
			icon: isRTL() ? rotateRight : rotateLeft,
			callback: ( { close } ) => {
				revertTemplate( template );
				close();
			},
		} );
	}

	if ( isTemplateRemovable( template ) && ! isEditingPage ) {
		const label =
			template.type === TEMPLATE_POST_TYPE
				? sprintf(
						/* translators: %s: template title */
						__( 'Delete template: %s' ),
						decodeEntities( template.title )
				  )
				: sprintf(
						/* translators: %s: template part title */
						__( 'Delete template part: %s' ),
						decodeEntities( template.title )
				  );
		commands.push( {
			name: 'core/remove-template',
			label,
			icon: trash,
			callback: ( { close } ) => {
				removeTemplate( template );
				// Navigate to the template list
				history.push( {
					postType: template.type,
				} );
				close();
			},
		} );
	}

	return {
		isLoading: ! isLoaded,
		commands,
	};
}

function useAddNewPageCommand() {
	const history = useHistory();
	const { saveEntityRecord } = useDispatch( coreStore );
	const { createErrorNotice } = useDispatch( noticesStore );

	const createPageEntity = async ( { close } ) => {
		try {
			const _page = await saveEntityRecord(
				'postType',
				'page',
				{
					status: 'draft',
				},
				{
					throwOnError: true,
				}
			);
			if ( _page?.id ) {
				history.push( {
					postId: _page.id,
					postType: 'page',
					canvas: 'edit',
				} );
			}
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while creating the item.' );

			createErrorNotice( errorMessage, {
				type: 'snackbar',
			} );
		} finally {
			close();
		}
	};

	const commands = useMemo( () => {
		return [
			{
				name: 'core/edit-site/add-new-page',
				label: __( 'Add new page' ),
				icon: plus,
				callback: createPageEntity,
			},
		];
	}, [ createPageEntity ] );

	return {
		isLoading: false,
		commands,
	};
}

export function useEditModeCommands() {
	const { unregisterCommand } = useDispatch( commandsStore );
	unregisterCommand( 'core/add-new-page' );

	useCommandLoader( {
		name: 'core/edit-site/add-new-page',
		hook: useAddNewPageCommand,
	} );

	useCommandLoader( {
		name: 'core/edit-site/page-content-focus',
		hook: usePageContentFocusCommands,
		context: 'entity-edit',
	} );

	useCommandLoader( {
		name: 'core/edit-site/manipulate-document',
		hook: useManipulateDocumentCommands,
	} );
}
