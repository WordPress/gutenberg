/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { trash, backup, layout, page } from '@wordpress/icons';
import { useCommandLoader } from '@wordpress/commands';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import useEditedEntityRecord from '../../components/use-edited-entity-record';
import isTemplateRemovable from '../../utils/is-template-removable';
import isTemplateRevertable from '../../utils/is-template-revertable';
import { unlock } from '../../lock-unlock';

const { useHistory } = unlock( routerPrivateApis );

function useEditModeCommandLoader() {
	const { isLoaded, record: template } = useEditedEntityRecord();
	const { removeTemplate, revertTemplate, setHasPageContentFocus } =
		useDispatch( editSiteStore );
	const history = useHistory();
	const { isPage, hasPageContentFocus } = useSelect(
		( select ) => ( {
			isPage: select( editSiteStore ).isPage(),
			hasPageContentFocus: select( editSiteStore ).hasPageContentFocus(),
		} ),
		[]
	);

	if ( ! isLoaded ) {
		return { isLoading: true, commands: [] };
	}

	const commands = [];

	if ( isPage ) {
		if ( hasPageContentFocus ) {
			commands.push( {
				name: 'core/switch-to-template-focus',
				label: __( 'Edit template' ),
				icon: layout,
				context: 'site-editor-edit',
				callback: ( { close } ) => {
					setHasPageContentFocus( false );
					close();
				},
			} );
		} else {
			commands.push( {
				name: 'core/switch-to-page-focus',
				label: __( 'Back to page' ),
				icon: page,
				context: 'site-editor-edit',
				callback: ( { close } ) => {
					setHasPageContentFocus( true );
					close();
				},
			} );
		}
	}

	if ( isTemplateRevertable( template ) && ! hasPageContentFocus ) {
		const label =
			template.type === 'wp_template'
				? __( 'Reset template' )
				: __( 'Reset template part' );
		commands.push( {
			name: 'core/reset-template',
			label,
			icon: backup,
			callback: ( { close } ) => {
				revertTemplate( template );
				close();
			},
		} );
	}

	if ( isTemplateRemovable( template ) && ! hasPageContentFocus ) {
		const label =
			template.type === 'wp_template'
				? __( 'Delete template' )
				: __( 'Delete template part' );
		commands.push( {
			name: 'core/remove-template',
			label,
			icon: trash,
			context: 'site-editor-edit',
			callback: ( { close } ) => {
				removeTemplate( template );
				// Navigate to the template list
				history.push( {
					path: '/' + template.type,
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

export function useEditModeCommands() {
	useCommandLoader( {
		name: 'core/edit-site/manipulate-document',
		hook: useEditModeCommandLoader,
		context: 'site-editor-edit',
	} );
}
