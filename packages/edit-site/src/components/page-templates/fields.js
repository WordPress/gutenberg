/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Icon, __experimentalHStack as HStack } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState, useMemo } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { parse } from '@wordpress/blocks';
import {
	BlockPreview,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { EditorProvider } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { Async } from '../async';
import { default as Link, useLink } from '../routes/link';
import { useAddedBy } from './hooks';

import usePatternSettings from '../page-patterns/use-pattern-settings';
import { unlock } from '../../lock-unlock';

const { useGlobalStyle } = unlock( blockEditorPrivateApis );

function PreviewField( { item } ) {
	const settings = usePatternSettings();
	const [ backgroundColor = 'white' ] = useGlobalStyle( 'color.background' );
	const blocks = useMemo( () => {
		return parse( item.content.raw );
	}, [ item.content.raw ] );
	const { onClick } = useLink( {
		postId: item.id,
		postType: item.type,
		canvas: 'edit',
	} );

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
				<button
					className="page-templates-preview-field__button"
					type="button"
					onClick={ onClick }
					aria-label={ item.title?.rendered || item.title }
				>
					{ isEmpty && __( 'Empty template' ) }
					{ ! isEmpty && (
						<Async>
							<BlockPreview blocks={ blocks } />
						</Async>
					) }
				</button>
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

function TitleField( { item } ) {
	const linkProps = {
		params: {
			postId: item.id,
			postType: item.type,
			canvas: 'edit',
		},
	};
	return (
		<Link { ...linkProps }>
			{ decodeEntities( item.title?.rendered ) || __( '(no title)' ) }
		</Link>
	);
}

export const titleField = {
	label: __( 'Template' ),
	id: 'title',
	getValue: ( { item } ) => item.title?.rendered,
	render: TitleField,
	enableHiding: false,
	enableGlobalSearch: true,
};

export const descriptionField = {
	label: __( 'Description' ),
	id: 'description',
	render: ( { item } ) => {
		return (
			item.description && (
				<span className="page-templates-description">
					{ decodeEntities( item.description ) }
				</span>
			)
		);
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
	getValue: ( { item } ) => item.author_text,
	render: AuthorField,
};
