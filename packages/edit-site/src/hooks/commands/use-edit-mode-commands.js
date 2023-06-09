/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { trash, backup } from '@wordpress/icons';
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
	const { removeTemplate, revertTemplate } = useDispatch( editSiteStore );
	const history = useHistory();
	const { isLoaded, record: template } = useEditedEntityRecord();
	const isRemovable =
		isLoaded && !! template && isTemplateRemovable( template );
	const isRevertable =
		isLoaded && !! template && isTemplateRevertable( template );

	const commands = [];
	if ( isRemovable ) {
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
	if ( isRevertable ) {
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
