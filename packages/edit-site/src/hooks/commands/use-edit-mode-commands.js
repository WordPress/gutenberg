/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { trash, backup, edit } from '@wordpress/icons';
import { useCommandLoader } from '@wordpress/commands';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import useEditedEntityRecord from '../../components/use-edited-entity-record';
import isTemplateRemovable from '../../utils/is-template-removable';
import isTemplateRevertable from '../../utils/is-template-revertable';
import { unlock } from '../../private-apis';

const { useHistory } = unlock( routerPrivateApis );

function useEditModeCommandLoader() {
	const templateParts = useSelect(
		( select ) => select( editSiteStore ).getCurrentTemplateTemplateParts(),
		[]
	);
	const { removeTemplate, revertTemplate } = useDispatch( editSiteStore );
	const history = useHistory();
	const { isLoaded, record: template } = useEditedEntityRecord();
	const isRemovable =
		isLoaded && !! template && isTemplateRemovable( template );
	const isRevertable =
		isLoaded && !! template && isTemplateRevertable( template );

	const commands = useMemo( () => {
		const result = [];
		templateParts.forEach( ( { templatePart } ) => {
			result.push( {
				name: 'core/edit-template-part' + templatePart.id,
				label: sprintf(
					/* translators: %s: template part title */
					__( 'Edit %s' ),
					templatePart.title?.rendered
				),
				icon: edit,
				context: 'site-editor-edit',
				callback: ( { close } ) => {
					const fromState =
						template.type === 'wp_template'
							? {
									fromTemplateId: template.id,
							  }
							: undefined;
					history.push(
						{
							postId: templatePart.id,
							postType: templatePart.type,
							canvas: 'edit',
						},
						fromState
					);
					close();
				},
			} );
		} );

		if ( isRemovable ) {
			const label =
				template.type === 'wp_template'
					? __( 'Delete template' )
					: __( 'Delete template part' );
			result.push( {
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
			result.push( {
				name: 'core/reset-template',
				label,
				icon: backup,
				callback: ( { close } ) => {
					revertTemplate( template );
					close();
				},
			} );
		}

		return result;
	}, [
		isRemovable,
		isRevertable,
		templateParts,
		history,
		removeTemplate,
		revertTemplate,
		template,
	] );

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
