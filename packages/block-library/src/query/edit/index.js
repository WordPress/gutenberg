/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { cloneBlock } from '@wordpress/blocks';
import { useInstanceId } from '@wordpress/compose';
import { useEffect } from '@wordpress/element';
import {
	BlockControls,
	InspectorControls,
	useBlockProps,
	useSetting,
	store as blockEditorStore,
	useInnerBlocksProps,
	__experimentalBlockPatternSetup as BlockPatternSetup,
} from '@wordpress/block-editor';
import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import QueryToolbar from './query-toolbar';
import QueryInspectorControls from './inspector-controls';
import QueryPlaceholder from './query-placeholder';
import { DEFAULTS_POSTS_PER_PAGE } from '../constants';
import { getFirstQueryClientIdFromBlocks } from '../utils';

const TEMPLATE = [ [ 'core/post-template' ] ];
export function QueryContent( { attributes, setAttributes } ) {
	const {
		queryId,
		query,
		displayLayout,
		tagName: TagName = 'div',
		layout = {},
	} = attributes;
	const { __unstableMarkNextChangeAsNotPersistent } = useDispatch(
		blockEditorStore
	);
	const instanceId = useInstanceId( QueryContent );
	const { themeSupportsLayout } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return { themeSupportsLayout: getSettings()?.supportsLayout };
	}, [] );
	const defaultLayout = useSetting( 'layout' ) || {};
	const usedLayout = !! layout && layout.inherit ? defaultLayout : layout;
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
		__experimentalLayout: themeSupportsLayout ? usedLayout : undefined,
	} );
	const { postsPerPage } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return {
			postsPerPage:
				+getSettings().postsPerPage || DEFAULTS_POSTS_PER_PAGE,
		};
	}, [] );
	// There are some effects running where some initialization logic is
	// happening and setting some values to some attributes (ex. queryId).
	// These updates can cause an `undo trap` where undoing will result in
	// resetting again, so we need to mark these changes as not persistent
	// with `__unstableMarkNextChangeAsNotPersistent`.

	// Changes in query property (which is an object) need to be in the same callback,
	// because updates are batched after the render and changes in different query properties
	// would cause to override previous wanted changes.
	useEffect( () => {
		const newQuery = {};
		if ( ! query.perPage && postsPerPage ) {
			newQuery.perPage = postsPerPage;
		}
		if ( !! Object.keys( newQuery ).length ) {
			__unstableMarkNextChangeAsNotPersistent();
			updateQuery( newQuery );
		}
	}, [ query.perPage ] );
	// We need this for multi-query block pagination.
	// Query parameters for each block are scoped to their ID.
	useEffect( () => {
		if ( ! Number.isFinite( queryId ) ) {
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( { queryId: instanceId } );
		}
	}, [ queryId, instanceId ] );
	const updateQuery = ( newQuery ) =>
		setAttributes( { query: { ...query, ...newQuery } } );
	const updateDisplayLayout = ( newDisplayLayout ) =>
		setAttributes( {
			displayLayout: { ...displayLayout, ...newDisplayLayout },
		} );
	return (
		<>
			<QueryInspectorControls
				attributes={ attributes }
				setQuery={ updateQuery }
				setDisplayLayout={ updateDisplayLayout }
			/>
			<BlockControls>
				<QueryToolbar
					attributes={ attributes }
					setQuery={ updateQuery }
					setDisplayLayout={ updateDisplayLayout }
				/>
			</BlockControls>
			<InspectorControls __experimentalGroup="advanced">
				<SelectControl
					label={ __( 'HTML element' ) }
					options={ [
						{ label: __( 'Default (<div>)' ), value: 'div' },
						{ label: '<main>', value: 'main' },
						{ label: '<section>', value: 'section' },
						{ label: '<aside>', value: 'aside' },
					] }
					value={ TagName }
					onChange={ ( value ) =>
						setAttributes( { tagName: value } )
					}
				/>
			</InspectorControls>
			<TagName { ...innerBlocksProps } />
		</>
	);
}

function QueryPatternSetup( props ) {
	const { clientId, name: blockName } = props;
	const blockProps = useBlockProps();
	const { replaceBlock, selectBlock } = useDispatch( blockEditorStore );
	const onBlockPatternSelect = ( blocks ) => {
		const clonedBlocks = blocks.map( ( block ) => cloneBlock( block ) );
		const firstQueryClientId = getFirstQueryClientIdFromBlocks(
			clonedBlocks
		);
		replaceBlock( clientId, clonedBlocks );
		if ( firstQueryClientId ) {
			selectBlock( firstQueryClientId );
		}
	};
	// `startBlankComponent` is what to render when clicking `Start blank`
	// or if no matched patterns are found.
	return (
		<div { ...blockProps }>
			<BlockPatternSetup
				blockName={ blockName }
				clientId={ clientId }
				startBlankComponent={ <QueryPlaceholder { ...props } /> }
				onBlockPatternSelect={ onBlockPatternSelect }
			/>
		</div>
	);
}

const QueryEdit = ( props ) => {
	const { clientId } = props;
	const hasInnerBlocks = useSelect(
		( select ) =>
			!! select( blockEditorStore ).getBlocks( clientId ).length,
		[ clientId ]
	);
	const Component = hasInnerBlocks ? QueryContent : QueryPatternSetup;
	return <Component { ...props } />;
};

export default QueryEdit;
