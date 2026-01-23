/**
 * WordPress dependencies
 */
import { useCallback, useMemo, useState } from '@wordpress/element';
// @ts-ignore
import { parse } from '@wordpress/blocks';
import type { WpTemplate } from '@wordpress/core-data';
import { store as coreStore } from '@wordpress/core-data';
import type { DataFormControlProps } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
// @ts-expect-error block-editor is not typed correctly.
import { __experimentalBlockPatternsList as BlockPatternsList } from '@wordpress/block-editor';
import {
	Button,
	Dropdown,
	MenuGroup,
	MenuItem,
	Modal,
} from '@wordpress/components';
import { useAsyncList } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { getItemTitle } from '../../actions/utils';
import type { BasePost } from '../../types';
import { unlock } from '../../lock-unlock';

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
	const slug = data.slug;

	const { canSwitchTemplate, templates } = useSelect(
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
	const foundTemplate = templates.find(
		( template ) => template.slug === value
	);

	const currentTemplate = useSelect(
		( select ) => {
			if ( foundTemplate ) {
				return foundTemplate;
			}

			let slugToCheck;
			// In `draft` status we might not have a slug available, so we use the `single`
			// post type templates slug(ex page, single-post, single-product etc..).
			// Pages do not need the `single` prefix in the slug to be prioritized
			// through template hierarchy.
			if ( slug ) {
				slugToCheck =
					postType === 'page'
						? `${ postType }-${ slug }`
						: `single-${ postType }-${ slug }`;
			} else {
				slugToCheck =
					postType === 'page' ? 'page' : `single-${ postType }`;
			}

			if ( postType ) {
				const templateId = select( coreStore ).getDefaultTemplateId( {
					slug: slugToCheck,
				} );

				return select( coreStore ).getEntityRecord(
					'postType',
					'wp_template',
					templateId
				);
			}
		},
		[ foundTemplate, postType, slug ]
	);

	const [ showModal, setShowModal ] = useState( false );

	const onChangeControl = useCallback(
		( newValue: string ) =>
			onChange( {
				[ id ]: newValue,
			} ),
		[ id, onChange ]
	);

	return (
		<fieldset className="fields-controls__template">
			<Dropdown
				popoverProps={ { placement: 'bottom-start' } }
				renderToggle={ ( { onToggle } ) => (
					<Button
						__next40pxDefaultSize
						variant="tertiary"
						size="compact"
						onClick={ onToggle }
					>
						{ currentTemplate
							? getItemTitle( currentTemplate )
							: '' }
					</Button>
				) }
				renderContent={ ( { onToggle } ) => (
					<MenuGroup>
						<MenuItem
							onClick={ () => {
								setShowModal( true );
								onToggle();
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
										onToggle();
									} }
								>
									{ __( 'Use default template' ) }
								</MenuItem>
							)
						}
					</MenuGroup>
				) }
			/>
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
							blockPatterns={ templatesAsPatterns }
							shownPatterns={ shownTemplates }
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
		</fieldset>
	);
};
