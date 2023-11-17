/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	getCategories,
	getBlockTypes,
	getBlockFromExample,
	createBlock,
} from '@wordpress/blocks';
import {
	BlockList,
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
	__unstableEditorStyles as EditorStyles,
	__unstableIframe as Iframe,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useResizeObserver } from '@wordpress/compose';
import { useMemo, useState, memo } from '@wordpress/element';
import { ENTER, SPACE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import EditorCanvasContainer from '../editor-canvas-container';

const { ExperimentalBlockEditorProvider, useGlobalStyle } = unlock(
	blockEditorPrivateApis
);

/**
 * Internal dependencies
 */
import Page from '../page';
import GlobalStylesSidebar from '../sidebar-edit-mode/global-styles-sidebar';
import { StyleBookBody } from '../style-book';
import { GlobalStylesUI } from '../global-styles';
import Editor from '../editor';

function getExamples() {
	// Use our own example for the Heading block so that we can show multiple
	// heading levels.
	const headingsExample = {
		name: 'core/heading',
		title: __( 'Headings' ),
		category: 'text',
		blocks: [
			createBlock( 'core/heading', {
				content: __( 'Code Is Poetry' ),
				level: 1,
			} ),
			createBlock( 'core/heading', {
				content: __( 'Code Is Poetry' ),
				level: 2,
			} ),
			createBlock( 'core/heading', {
				content: __( 'Code Is Poetry' ),
				level: 3,
			} ),
			createBlock( 'core/heading', {
				content: __( 'Code Is Poetry' ),
				level: 4,
			} ),
			createBlock( 'core/heading', {
				content: __( 'Code Is Poetry' ),
				level: 5,
			} ),
		],
	};

	const otherExamples = getBlockTypes()
		.filter( ( blockType ) => {
			const { name, example, supports } = blockType;
			return (
				name !== 'core/heading' &&
				!! example &&
				supports.inserter !== false
			);
		} )
		.map( ( blockType ) => ( {
			name: blockType.name,
			title: blockType.title,
			category: blockType.category,
			blocks: getBlockFromExample( blockType.name, blockType.example ),
		} ) );

	return [ headingsExample, ...otherExamples ];
}

export default function PageStyles() {
	// TODO: we need to handle properly `data={ data || EMPTY_ARRAY }` for when `isLoading`.
	const examples = useMemo( getExamples, [] );

	const originalSettings = useSelect(
		( select ) => select( blockEditorStore ).getSettings(),
		[]
	);
	const settings = useMemo(
		() => ( { ...originalSettings, __unstableIsPreviewMode: true } ),
		[ originalSettings ]
	);

	const [ resizeObserver, sizes ] = useResizeObserver();

	return (
		<>
			<Page title={ __( 'Styles' ) } small>
				<GlobalStylesUI />
			</Page>
			<Page>
				<div className="edit-site-page-pages-preview">
					<StyleBookBody
						examples={ examples }
						onClick={ ( block ) => console.log( block ) }
						onSelect={ ( block ) => console.log( block ) }
						isSelected={ ( block ) => console.log( block ) }
						settings={ settings }
						sizes={ sizes }
					/>
				</div>
			</Page>
		</>
	);
}
