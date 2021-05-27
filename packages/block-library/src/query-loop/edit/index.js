/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useInstanceId } from '@wordpress/compose';
import { useEffect, useMemo } from '@wordpress/element';
import {
	BlockControls,
	InspectorAdvancedControls,
	useBlockProps,
	useSetting,
	store as blockEditorStore,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	__experimentalBlockPatternSetup as BlockPatternSetup,
} from '@wordpress/block-editor';
import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import QueryLoopToolbar from './query-loop-toolbar';
import QueryLoopInspectorControls from './query-loop-inspector-controls';
import QueryLoopPlaceholder from './query-loop-placeholder';
import { DEFAULTS_POSTS_PER_PAGE } from '../constants';

const TEMPLATE = [ [ 'core/post-template' ] ];
export function QueryLoopContent( { attributes, setAttributes } ) {
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
	const instanceId = useInstanceId( QueryLoopContent );
	const { themeSupportsLayout } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return { themeSupportsLayout: getSettings()?.supportsLayout };
	}, [] );
	const defaultLayout = useSetting( 'layout' ) || {};
	const usedLayout = !! layout && layout.inherit ? defaultLayout : layout;
	const { contentSize, wideSize } = usedLayout;
	const blockProps = useBlockProps();
	const _layout = useMemo( () => {
		if ( themeSupportsLayout ) {
			const alignments =
				contentSize || wideSize
					? [ 'wide', 'full' ]
					: [ 'left', 'center', 'right' ];
			return {
				type: 'default',
				// Find a way to inject this in the support flag code (hooks).
				alignments,
			};
		}
		return undefined;
	}, [ themeSupportsLayout, contentSize, wideSize ] );
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
		__experimentalLayout: _layout,
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
	// would cause to overide previous wanted changes.
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
		if ( ! queryId ) {
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
			<QueryLoopInspectorControls
				attributes={ attributes }
				setQuery={ updateQuery }
				setDisplayLayout={ updateDisplayLayout }
			/>
			<BlockControls>
				<QueryLoopToolbar
					attributes={ attributes }
					setQuery={ updateQuery }
					setDisplayLayout={ updateDisplayLayout }
				/>
			</BlockControls>
			<InspectorAdvancedControls>
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
			</InspectorAdvancedControls>
			<TagName { ...innerBlocksProps } />
		</>
	);
}

function QueryLoopPatternSetup( props ) {
	const { clientId, name: blockName } = props;
	const blockProps = useBlockProps();
	// `startBlankComponent` is what to render when clicking `Start blank`
	// or if no matched patterns are found.
	return (
		<div { ...blockProps }>
			<BlockPatternSetup
				blockName={ blockName }
				clientId={ clientId }
				startBlankComponent={ <QueryLoopPlaceholder { ...props } /> }
			/>
		</div>
	);
}

const QueryLoopEdit = ( props ) => {
	const { clientId } = props;
	const hasInnerBlocks = useSelect(
		( select ) =>
			!! select( blockEditorStore ).getBlocks( clientId ).length,
		[ clientId ]
	);
	const Component = hasInnerBlocks ? QueryLoopContent : QueryLoopPatternSetup;
	return <Component { ...props } />;
};

export default QueryLoopEdit;
