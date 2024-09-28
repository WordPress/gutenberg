/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useInstanceId } from '@wordpress/compose';
import { useEffect, useCallback } from '@wordpress/element';
import {
	BlockControls,
	InspectorControls,
	useBlockProps,
	store as blockEditorStore,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import EnhancedPaginationControl from './inspector-controls/enhanced-pagination-control';
import QueryToolbar from './query-toolbar';
import QueryInspectorControls from './inspector-controls';
import EnhancedPaginationModal from './enhanced-pagination-modal';

const DEFAULTS_POSTS_PER_PAGE = 3;

const TEMPLATE = [ [ 'core/post-template' ] ];
export default function QueryContent( {
	attributes,
	setAttributes,
	openPatternSelectionModal,
	name,
	clientId,
	context,
} ) {
	const {
		queryId,
		query,
		displayLayout,
		enhancedPagination,
		tagName: TagName = 'div',
		query: { inherit } = {},
	} = attributes;
	const { postType } = context;
	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
	const instanceId = useInstanceId( QueryContent );
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
	} );
	const isTemplate = useSelect(
		( select ) => {
			const currentTemplate =
				select( coreStore ).__experimentalGetTemplateForLink()?.type;
			const isInTemplate = 'wp_template' === currentTemplate;
			const isInSingularContent = postType !== undefined;
			return isInTemplate && ! isInSingularContent;
		},
		[ postType ]
	);
	const { postsPerPage } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		const { getEntityRecord, getEntityRecordEdits, canUser } =
			select( coreStore );
		const settingPerPage = canUser( 'read', {
			kind: 'root',
			name: 'site',
		} )
			? +getEntityRecord( 'root', 'site' )?.posts_per_page
			: +getSettings().postsPerPage;

		// Gets changes made via the template area posts per page setting. These won't be saved
		// until the page is saved, but we should reflect this setting within the query loops
		// that inherit it.
		const editedSettingPerPage = +getEntityRecordEdits( 'root', 'site' )
			?.posts_per_page;

		return {
			postsPerPage:
				editedSettingPerPage ||
				settingPerPage ||
				DEFAULTS_POSTS_PER_PAGE,
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
	const updateQuery = useCallback(
		( newQuery ) => setAttributes( { query: { ...query, ...newQuery } } ),
		[ query, setAttributes ]
	);
	useEffect( () => {
		const newQuery = {};
		// When we inherit from global query always need to set the `perPage`
		// based on the reading settings.
		if ( inherit && query.perPage !== postsPerPage ) {
			newQuery.perPage = postsPerPage;
		} else if ( ! query.perPage && postsPerPage ) {
			newQuery.perPage = postsPerPage;
		}
		// We need to reset the `inherit` value if not in a template, as queries
		// are not inherited when outside a template (e.g. when in singular content).
		if ( ! isTemplate && query.inherit ) {
			newQuery.inherit = false;
		}
		if ( !! Object.keys( newQuery ).length ) {
			__unstableMarkNextChangeAsNotPersistent();
			updateQuery( newQuery );
		}
	}, [
		query.perPage,
		postsPerPage,
		inherit,
		isTemplate,
		query.inherit,
		__unstableMarkNextChangeAsNotPersistent,
		updateQuery,
	] );
	// We need this for multi-query block pagination.
	// Query parameters for each block are scoped to their ID.
	useEffect( () => {
		if ( ! Number.isFinite( queryId ) ) {
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( { queryId: instanceId } );
		}
	}, [
		queryId,
		instanceId,
		__unstableMarkNextChangeAsNotPersistent,
		setAttributes,
	] );
	const updateDisplayLayout = ( newDisplayLayout ) =>
		setAttributes( {
			displayLayout: { ...displayLayout, ...newDisplayLayout },
		} );
	const htmlElementMessages = {
		main: __(
			'The <main> element should be used for the primary content of your document only.'
		),
		section: __(
			"The <section> element should represent a standalone portion of the document that can't be better represented by another element."
		),
		aside: __(
			"The <aside> element should represent a portion of a document whose content is only indirectly related to the document's main content."
		),
	};

	return (
		<>
			<EnhancedPaginationModal
				attributes={ attributes }
				setAttributes={ setAttributes }
				clientId={ clientId }
			/>
			<InspectorControls>
				<QueryInspectorControls
					attributes={ attributes }
					setQuery={ updateQuery }
					setDisplayLayout={ updateDisplayLayout }
					setAttributes={ setAttributes }
					clientId={ clientId }
					isTemplate={ isTemplate }
				/>
			</InspectorControls>
			<BlockControls>
				<QueryToolbar
					name={ name }
					clientId={ clientId }
					attributes={ attributes }
					setQuery={ updateQuery }
					openPatternSelectionModal={ openPatternSelectionModal }
				/>
			</BlockControls>
			<InspectorControls group="advanced">
				<SelectControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
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
					help={ htmlElementMessages[ TagName ] }
				/>
				<EnhancedPaginationControl
					enhancedPagination={ enhancedPagination }
					setAttributes={ setAttributes }
					clientId={ clientId }
				/>
			</InspectorControls>
			<TagName { ...innerBlocksProps } />
		</>
	);
}
