/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useInstanceId } from '@wordpress/compose';
import { useEffect, useCallback } from '@wordpress/element';
import {
	InspectorControls,
	useBlockProps,
	store as blockEditorStore,
	useInnerBlocksProps,
	privateApis as blockEditorPrivateApis,
	BlockControls,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import EnhancedPaginationControl from './inspector-controls/enhanced-pagination-control';
import { unlock } from '../../lock-unlock';
import QueryInspectorControls from './inspector-controls';
import EnhancedPaginationModal from './enhanced-pagination-modal';
import { getQueryContextFromTemplate } from '../utils';
import QueryToolbar from './query-toolbar';

const { HTMLElementControl } = unlock( blockEditorPrivateApis );

const DEFAULTS_POSTS_PER_PAGE = 3;

const TEMPLATE = [ [ 'core/post-template' ] ];
export default function QueryContent( {
	attributes,
	setAttributes,
	clientId,
	context,
	name,
} ) {
	const {
		queryId,
		query,
		enhancedPagination,
		tagName: TagName = 'div',
		query: { inherit } = {},
	} = attributes;
	const { templateSlug } = context;
	const { isSingular } = getQueryContextFromTemplate( templateSlug );
	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
	const instanceId = useInstanceId( QueryContent );
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
	} );
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
		( newQuery ) =>
			setAttributes( ( prevAttributes ) => ( {
				query: { ...prevAttributes.query, ...newQuery },
			} ) ),
		[ setAttributes ]
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

		if ( !! Object.keys( newQuery ).length ) {
			__unstableMarkNextChangeAsNotPersistent();
			updateQuery( newQuery );
		}
	}, [
		query.perPage,
		inherit,
		postsPerPage,
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

	return (
		<>
			<BlockControls group="other">
				<QueryToolbar
					clientId={ clientId }
					attributes={ attributes }
					hasInnerBlocks
				/>
			</BlockControls>
			<EnhancedPaginationModal
				attributes={ attributes }
				setAttributes={ setAttributes }
				clientId={ clientId }
			/>
			<InspectorControls>
				<QueryInspectorControls
					name={ name }
					attributes={ attributes }
					setQuery={ updateQuery }
					setAttributes={ setAttributes }
					clientId={ clientId }
					isSingular={ isSingular }
				/>
			</InspectorControls>
			<InspectorControls group="advanced">
				<HTMLElementControl
					tagName={ TagName }
					onChange={ ( value ) =>
						setAttributes( { tagName: value } )
					}
					clientId={ clientId }
					options={ [
						{ label: __( 'Default (<div>)' ), value: 'div' },
						{ label: '<main>', value: 'main' },
						{ label: '<section>', value: 'section' },
						{ label: '<aside>', value: 'aside' },
					] }
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
