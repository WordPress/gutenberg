import { BlockPreview } from '@wordpress/block-editor';
import { parse } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Spinner } from '@wordpress/ui';
import { unlock } from '../../lock-unlock';

/**
 * The template that renders the front of the site.
 *
 * @return {?string|undefined} Its ID, null if there is none, undefined while
 *                             it is being worked out.
 */
function useFrontTemplateId() {
	return useSelect( ( select ) => {
		const { getHomePage, getTemplateId } = unlock( select( coreStore ) );
		const homePage = getHomePage();

		if ( ! homePage ) {
			return undefined;
		}
		if ( homePage.postType === 'page' ) {
			return getTemplateId( 'page', homePage.postId );
		}
		if ( homePage.postType === 'wp_template' ) {
			return homePage.postId;
		}

		// Latest posts on the front: the home template, or else the index.
		const { getDefaultTemplateId } = select( coreStore );
		const homeId = getDefaultTemplateId( { slug: 'home' } );
		if ( homeId === undefined ) {
			return undefined;
		}
		return homeId || getDefaultTemplateId( { slug: 'index' } ) || null;
	}, [] );
}

/**
 * The front of the site, as a read-only preview. Its header, footer and
 * menus are read from the same records the editor edits, so unsaved changes
 * to a menu show here as they are made.
 *
 * @return {Element} The preview.
 */
export default function MenuSitePreview() {
	const templateId = useFrontTemplateId();
	const template = useSelect(
		( select ) =>
			templateId
				? select( coreStore ).getEditedEntityRecord(
						'postType',
						'wp_template',
						templateId
					)
				: null,
		[ templateId ]
	);
	const blocks = useMemo( () => {
		if ( ! template ) {
			return null;
		}
		if ( Array.isArray( template.blocks ) ) {
			return template.blocks;
		}
		const content =
			typeof template.content === 'string'
				? template.content
				: template.content?.raw;
		return content
			? parse( content, { __unstableSkipMigrationLogs: true } )
			: null;
	}, [ template ] );

	if ( templateId === undefined || ( templateId && ! blocks ) ) {
		return (
			<div
				style={ {
					display: 'flex',
					justifyContent: 'center',
					padding: 32,
				} }
			>
				<Spinner />
			</div>
		);
	}

	if ( ! blocks?.length ) {
		return <p>{ __( 'There’s no preview of your site to show.' ) }</p>;
	}

	return (
		<div
			className="menu-locations__site-preview"
			// Nothing in a preview is reachable by pointer or keyboard.
			inert=""
		>
			<BlockPreview.Async>
				<BlockPreview blocks={ blocks } viewportWidth={ 1200 } />
			</BlockPreview.Async>
		</div>
	);
}
