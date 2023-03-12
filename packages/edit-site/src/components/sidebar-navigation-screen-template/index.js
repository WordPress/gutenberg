/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { pencil } from '@wordpress/icons';
import { __experimentalUseNavigator as useNavigator } from '@wordpress/components';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __experimentalBlockPatternList as BlockPatternList } from '@wordpress/block-editor';
import { useAsyncList } from '@wordpress/compose';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import useEditedEntityRecord from '../use-edited-entity-record';
import { unlock } from '../../private-apis';
import { store as editSiteStore } from '../../store';
import SidebarButton from '../sidebar-button';
import { parse } from '@wordpress/blocks';

export default function SidebarNavigationScreenTemplate() {
	const { params } = useNavigator();
	const { postType, postId } = params;
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
	const { getDescription, getTitle, record, editRecord } =
		useEditedEntityRecord( postType, postId );
	let description = getDescription();
	if ( ! description ) {
		if ( record.type === 'wp_template' && record.is_custom ) {
			description = __(
				'This is a custom template that can be applied manually to any Post or Page.'
			);
		} else if ( record.type === 'wp_template_part' ) {
			description = sprintf(
				// translators: %s: template part title e.g: "Header".
				__( 'This is your %s template part.' ),
				getTitle()
			);
		}
	}

	const [ templates, setTemplates ] = useState( [] );

	useEffect( () => {
		if ( ! record.slug && ! record.area ) return;
		apiFetch( {
			path: `/wp-block-editor/v2/themes-directory-templates?slug=${
				record.slug || ''
			}&area=${ record.area || '' }`,
		} ).then( ( data ) => {
			setTemplates( data );
		} );
	}, [ record.slug, record.area ] );

	const patterns = useMemo( () => {
		return templates.map( ( template ) => {
			return {
				blocks: parse( template.html ),
				name: template.name,
			};
		} );
	}, [ templates ] );

	const currentShownPatterns = useAsyncList( patterns );

	return (
		<SidebarNavigationScreen
			title={ getTitle() }
			actions={
				<SidebarButton
					onClick={ () => setCanvasMode( 'edit' ) }
					label={ __( 'Edit' ) }
					icon={ pencil }
				/>
			}
			description={ description }
			content={
				<BlockPatternList
					blockPatterns={ patterns }
					shownPatterns={ currentShownPatterns }
					onClickPattern={ ( pattern ) => {
						editRecord( {
							blocks: pattern.blocks,
						} );
					} }
				/>
			}
		/>
	);
}
