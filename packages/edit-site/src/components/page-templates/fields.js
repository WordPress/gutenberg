/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	Icon,
	__experimentalHStack as HStack,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { useState, useMemo } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { parse } from '@wordpress/blocks';
import {
	BlockPreview,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { EditorProvider } from '@wordpress/editor';
import {
	privateApis as corePrivateApis,
	store as coreStore,
} from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useAddedBy } from './hooks';
import { useDefaultTemplateTypes } from '../add-new-template/utils';
import usePatternSettings from '../page-patterns/use-pattern-settings';
import { unlock } from '../../lock-unlock';

const { useGlobalStyle } = unlock( blockEditorPrivateApis );
const { Badge } = unlock( componentsPrivateApis );
const { useEntityRecordsWithPermissions } = unlock( corePrivateApis );

function useAllDefaultTemplateTypes() {
	const defaultTemplateTypes = useDefaultTemplateTypes();
	const { records: staticRecords } = useEntityRecordsWithPermissions(
		'postType',
		'wp_registered_template',
		{ per_page: -1 }
	);
	return [
		...defaultTemplateTypes,
		...staticRecords
			?.filter( ( record ) => ! record.is_custom )
			.map( ( record ) => {
				return {
					slug: record.slug,
					title: record.title.rendered,
					description: record.description,
				};
			} ),
	];
}

function PreviewField( { item } ) {
	const settings = usePatternSettings();
	const [ backgroundColor = 'white' ] = useGlobalStyle( 'color.background' );
	const blocks = useMemo( () => {
		return parse( item.content.raw );
	}, [ item.content.raw ] );

	const isEmpty = ! blocks?.length;
	// Wrap everything in a block editor provider to ensure 'styles' that are needed
	// for the previews are synced between the site editor store and the block editor store.
	// Additionally we need to have the `__experimentalBlockPatterns` setting in order to
	// render patterns inside the previews.
	// TODO: Same approach is used in the patterns list and it becomes obvious that some of
	// the block editor settings are needed in context where we don't have the block editor.
	// Explore how we can solve this in a better way.
	return (
		<EditorProvider post={ item } settings={ settings }>
			<div
				className="page-templates-preview-field"
				style={ { backgroundColor } }
			>
				{ isEmpty && __( 'Empty template' ) }
				{ ! isEmpty && (
					<BlockPreview.Async>
						<BlockPreview blocks={ blocks } />
					</BlockPreview.Async>
				) }
			</div>
		</EditorProvider>
	);
}

export const previewField = {
	label: __( 'Preview' ),
	id: 'preview',
	render: PreviewField,
	enableSorting: false,
};

export const descriptionField = {
	label: __( 'Description' ),
	id: 'description',
	render: function RenderDescription( { item } ) {
		const defaultTemplateTypes = useAllDefaultTemplateTypes();
		const defaultTemplateType = defaultTemplateTypes.find(
			( type ) => type.slug === item.slug
		);
		return item.description
			? decodeEntities( item.description )
			: defaultTemplateType?.description;
	},
	enableSorting: false,
	enableGlobalSearch: true,
};

function AuthorField( { item } ) {
	const [ isImageLoaded, setIsImageLoaded ] = useState( false );
	const { text, icon, imageUrl } = useAddedBy( item.type, item.id );

	return (
		<HStack alignment="left" spacing={ 0 }>
			{ imageUrl && (
				<div
					className={ clsx( 'page-templates-author-field__avatar', {
						'is-loaded': isImageLoaded,
					} ) }
				>
					<img
						onLoad={ () => setIsImageLoaded( true ) }
						alt=""
						src={ imageUrl }
					/>
				</div>
			) }
			{ ! imageUrl && (
				<div className="page-templates-author-field__icon">
					<Icon icon={ icon } />
				</div>
			) }
			<span className="page-templates-author-field__name">{ text }</span>
		</HStack>
	);
}

export const authorField = {
	label: __( 'Author' ),
	id: 'author',
	getValue: ( { item } ) => item.author_text ?? item.author,
	render: AuthorField,
};

export const activeField = {
	label: __( 'Status' ),
	id: 'active',
	getValue: ( { item } ) => item._isActive,
	render: function Render( { item } ) {
		if ( item._isCustom ) {
			return (
				<Badge
					intent="info"
					title={ __(
						'Custom templates cannot be active nor inactive.'
					) }
				>
					{ __( 'N/A' ) }
				</Badge>
			);
		}

		const isActive = item._isActive;
		return (
			<Badge intent={ isActive ? 'success' : 'default' }>
				{ isActive ? __( 'Active' ) : __( 'Inactive' ) }
			</Badge>
		);
	},
};

export const useThemeField = () => {
	const activeTheme = useSelect( ( select ) =>
		select( coreStore ).getCurrentTheme()
	);
	return {
		label: __( 'Compatible Theme' ),
		id: 'theme',
		getValue: ( { item } ) => item.theme,
		render: function Render( { item } ) {
			if ( item.theme === activeTheme.stylesheet ) {
				return <Badge intent="success">{ item.theme }</Badge>;
			}
			return <Badge intent="error">{ item.theme }</Badge>;
		},
	};
};

export const slugField = {
	label: __( 'Template Type' ),
	id: 'slug',
	getValue: ( { item } ) => item.slug,
	render: function Render( { item } ) {
		const defaultTemplateTypes = useAllDefaultTemplateTypes();
		const defaultTemplateType = defaultTemplateTypes.find(
			( type ) => type.slug === item.slug
		);
		return defaultTemplateType?.title || _x( 'Custom', 'template type' );
	},
};
