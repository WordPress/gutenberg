/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { __, sprintf, isRTL } from '@wordpress/i18n';
import { trash, rotateLeft, rotateRight, layout, page } from '@wordpress/icons';
import { useCommandLoader } from '@wordpress/commands';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import isTemplateRemovable from '../../utils/is-template-removable';
import isTemplateRevertable from '../../utils/is-template-revertable';
import { unlock } from '../../lock-unlock';
import { TEMPLATE_POST_TYPE } from '../../utils/constants';
import { useLink } from '../../components/routes/link';

const { useHistory } = unlock( routerPrivateApis );

function usePageContentFocusCommands() {
	const { isPage, canvasMode, templateId, currentPostType, title } =
		useSelect( ( select ) => {
			const { isPage: _isPage, getCanvasMode } = unlock(
				select( editSiteStore )
			);
			const {
				getCurrentPostType,
				getCurrentPostId,
				getCurrentTemplateId,
				getPostTitle,
			} = unlock( select( editorStore ) );
			const postType = getCurrentPostType();
			const postId = getCurrentPostId();
			return {
				isPage: _isPage(),
				canvasMode: getCanvasMode(),
				templateId: getCurrentTemplateId(),
				currentPostType: getCurrentPostType(),
				title: getPostTitle( postType, postId ),
			};
		}, [] );

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
				title
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
	const { removeTemplate, revertTemplate } = useDispatch( editSiteStore );
	const history = useHistory();
	const { isEditingPage, record, title } = useSelect( ( select ) => {
		const { getPostTitle, getCurrentPostType, getCurrentPostId } = unlock(
			select( editorStore )
		);
		const { isPage } = unlock( select( editSiteStore ) );
		const { getEditedEntityRecord } = select( coreStore );
		const postType = getCurrentPostType();
		const postId = getCurrentPostId();
		return {
			isEditingPage: isPage() && postType !== 'wp_template',
			record: getEditedEntityRecord( 'postType', postType, postId ),
			title: getPostTitle( postType, postId ),
		};
	}, [] );

	if ( ! record ) {
		return { isLoading: true, commands: [] };
	}

	const commands = [];

	if ( isTemplateRevertable( record ) && ! isEditingPage ) {
		const label =
			record.type === TEMPLATE_POST_TYPE
				? sprintf(
						/* translators: %s: template title */
						__( 'Reset template: %s' ),
						title
				  )
				: sprintf(
						/* translators: %s: template part title */
						__( 'Reset template part: %s' ),
						title
				  );
		commands.push( {
			name: 'core/reset-template',
			label,
			icon: isRTL() ? rotateRight : rotateLeft,
			callback: ( { close } ) => {
				revertTemplate( record );
				close();
			},
		} );
	}

	if ( isTemplateRemovable( record ) && ! isEditingPage ) {
		const label =
			record.type === TEMPLATE_POST_TYPE
				? sprintf(
						/* translators: %s: template title */
						__( 'Delete template: %s' ),
						title
				  )
				: sprintf(
						/* translators: %s: template part title */
						__( 'Delete template part: %s' ),
						title
				  );
		commands.push( {
			name: 'core/remove-template',
			label,
			icon: trash,
			callback: ( { close } ) => {
				removeTemplate( record );
				// Navigate to the template list
				history.push( {
					postType: record.type,
				} );
				close();
			},
		} );
	}

	return {
		isLoading: ! record,
		commands,
	};
}

export function useEditModeCommands() {
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
