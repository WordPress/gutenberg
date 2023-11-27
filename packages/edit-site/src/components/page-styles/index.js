/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	getBlockTypes,
	getBlockFromExample,
	createBlock,
} from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { useMemo, useEffect } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useResizeObserver } from '@wordpress/compose';
import { EntityProvider } from '@wordpress/core-data';
/**
 * Internal dependencies
 */
import Page from '../page';
import { StyleBookBody } from '../style-book';
import { GlobalStylesUI } from '../global-styles';
import { store as editSiteStore } from '../../store';
// import { useSpecificEditorSettings } from '../block-editor/use-site-editor-settings';
import { unlock } from '../../lock-unlock';
import { useInitEditedEntity } from '../sync-state-with-url/use-init-edited-entity-from-url';

const { useLocation, useHistory } = unlock( routerPrivateApis );

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

function StyleBookPanel() {
	const history = useHistory();
	const {
		params: { path, activeView },
	} = useLocation();
	const examples = useMemo( getExamples, [] );

	const originalSettings = useSelect(
		( select ) => select( blockEditorStore ).getSettings(),
		[]
	);

	const settings = useMemo(
		() => ( { ...originalSettings, __unstableIsPreviewMode: true } ),
		[ originalSettings ]
	);

	// const settings = useSpecificEditorSettings();

	const [ resizeObserver, sizes ] = useResizeObserver();

	return (
		<>
			{ resizeObserver }

			<StyleBookBody
				examples={ examples }
				onSelect={ ( blockName ) => {
					// Now go to the selected block.
					history.push( {
						path,
						activeView:
							'/blocks/' + encodeURIComponent( blockName ),
					} );
				} }
				sizes={ sizes }
				settings={ settings }
				isSelected={ ( blockName ) =>
					// Match '/blocks/core%2Fbutton' and
					// '/blocks/core%2Fbutton/typography', but not
					// '/blocks/core%2Fbuttons'.
					activeView ===
						`/blocks/${ encodeURIComponent( blockName ) }` ||
					activeView.startsWith(
						`/blocks/${ encodeURIComponent( blockName ) }/`
					)
				}
			/>
		</>
	);
}

export default function PageStyles() {
	const { setEditorCanvasContainerView } = unlock(
		useDispatch( editSiteStore )
	);

	// Clear the editor canvas container view when accessing the main navigation screen.
	useEffect( () => {
		setEditorCanvasContainerView( undefined );
	}, [ setEditorCanvasContainerView ] );
	// TODO: we need to handle properly `data={ data || EMPTY_ARRAY }` for when `isLoading`.
	const {
		params: { activeView },
	} = useLocation();

	useInitEditedEntity( {
		postId: '1298',
		postType: 'page',
	} );

	return (
		<>
			<EntityProvider kind="root" type="site">
				{ activeView && (
					<Page small>
						<GlobalStylesUI
							initialPath={ activeView }
							root={ false }
						/>
					</Page>
				) }
				<Page>
					<div className="edit-site-page-pages-preview">
						<StyleBookPanel />
						{ /* <Editor /> */ }
					</div>
				</Page>
			</EntityProvider>
		</>
	);
}
