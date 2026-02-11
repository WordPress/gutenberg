/**
 * WordPress dependencies
 */
import { useCallback, useMemo, useState } from '@wordpress/element';
// @ts-ignore
import { parse } from '@wordpress/blocks';
import type { WpTemplate } from '@wordpress/core-data';
import { store as coreStore } from '@wordpress/core-data';
import type { DataFormControlProps } from '@wordpress/dataviews';
import { usePanelMenuOnClose } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import { __experimentalBlockPatternsList } from '@wordpress/block-editor';
import { MenuGroup, MenuItem, Modal } from '@wordpress/components';
import { useAsyncList } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { unlock } from '../../lock-unlock';
import type { BasePost } from '../../types';

const BlockPatternsList = __experimentalBlockPatternsList as any;

const EMPTY_ARRAY: [] = [];

export const TemplateEdit = ( {
	data,
	field,
	onChange,
}: DataFormControlProps< BasePost > ) => {
	const { id } = field;
	const postType = data.type;
	const postId =
		typeof data.id === 'number' ? data.id : parseInt( data.id, 10 );

	const { templates, canSwitchTemplate } = useSelect(
		( select ) => {
			const allTemplates =
				select( coreStore ).getEntityRecords< WpTemplate >(
					'postType',
					'wp_template',
					{
						per_page: -1,
						post_type: postType,
					}
				) ?? EMPTY_ARRAY;

			const { getHomePage, getPostsPageId } = unlock(
				select( coreStore )
			);

			const isPostsPage = getPostsPageId() === +postId;
			const isFrontPage =
				postType === 'page' && getHomePage()?.postId === +postId;

			const allowSwitchingTemplate = ! isPostsPage && ! isFrontPage;

			return {
				templates: allTemplates,
				canSwitchTemplate: allowSwitchingTemplate,
			};
		},
		[ postId, postType ]
	);

	const templatesAsPatterns = useMemo( () => {
		if ( ! canSwitchTemplate ) {
			return [];
		}
		return templates
			.filter(
				( template ) =>
					template.is_custom &&
					template.slug !== data.template &&
					// Skip empty templates.
					!! template.content.raw
			)
			.map( ( template ) => ( {
				name: template.slug,
				blocks: parse( template.content.raw ),
				title: decodeEntities( template.title.rendered ),
				id: template.id,
			} ) );
	}, [ canSwitchTemplate, data.template, templates ] );

	const shownTemplates = useAsyncList( templatesAsPatterns );

	const value = field.getValue( { item: data } );

	const [ showModal, setShowModal ] = useState( false );
	const onClosePanelMenu = usePanelMenuOnClose();

	const onChangeControl = useCallback(
		( newValue: string ) =>
			onChange( {
				[ id ]: newValue,
			} ),
		[ id, onChange ]
	);

	return (
		<>
			<MenuGroup>
				<MenuItem
					onClick={ () => {
						onClosePanelMenu();
						setShowModal( true );
					} }
				>
					{ __( 'Change template' ) }
				</MenuItem>
				{
					// The default template in a post is indicated by an empty string
					value !== '' && (
						<MenuItem
							onClick={ () => {
								onChangeControl( '' );
							} }
						>
							{ __( 'Use default template' ) }
						</MenuItem>
					)
				}
			</MenuGroup>
			{ showModal && (
				<Modal
					title={ __( 'Choose a template' ) }
					onRequestClose={ () => setShowModal( false ) }
					overlayClassName="fields-controls__template-modal"
					isFullScreen
				>
					<div className="fields-controls__template-content">
						<BlockPatternsList
							label={ __( 'Templates' ) }
							blockPatterns={ shownTemplates }
							onClickPattern={ (
								template: ( typeof templatesAsPatterns )[ 0 ]
							) => {
								onChangeControl( template.name );
								setShowModal( false );
							} }
						/>
					</div>
				</Modal>
			) }
		</>
	);
};
