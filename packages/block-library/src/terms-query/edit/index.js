/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useInstanceId } from '@wordpress/compose';
import { useCallback, useEffect, useMemo } from '@wordpress/element';
import {
	BlockContextProvider,
	useBlockProps,
	store as blockEditorStore,
	useInnerBlocksProps,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { getQueryContextFromTemplate } from '../../utils/get-query-context-from-template';
import TermsQueryInspectorControls from './inspector-controls';

const TEMPLATE = [ [ 'core/term-template' ] ];
const FALLBACK_TAXONOMY = 'category';

export default function TermsQueryEdit( props ) {
	const { attributes, setAttributes, context } = props;
	const {
		termQueryId,
		termQuery = {},
		tagName: TagName = 'div',
	} = attributes;
	const {
		inherit,
		taxonomy: initialTaxonomy,
		parent: initialParent,
	} = termQuery;
	const {
		postId,
		termQuery: queryContext,
		taxonomy: contextTaxonomy,
		termId: termIdContext,
		templateSlug,
	} = context;
	const { taxonomy: queryContextTaxonomy, context: queryContextContext } =
		queryContext || {};

	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
	const instanceId = useInstanceId( TermsQueryEdit );
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
	} );

	// Maybe inherit parent from parent query.
	const parent = inherit ? termIdContext : initialParent || 0;

	const { taxonomy, inheritContext } = useMemo( () => {
		const { templateType, templateQuery, isSingular } =
			getQueryContextFromTemplate( templateSlug );

		// Maybe inherit taxonomy from parent query.
		let _taxonomy = inherit
			? contextTaxonomy || queryContextTaxonomy || initialTaxonomy
			: initialTaxonomy || FALLBACK_TAXONOMY;

		// If there is still no taxonomy, see if we can get one from the template.
		if ( ! _taxonomy && templateType ) {
			if ( templateType === 'category' ) {
				_taxonomy = templateType;
			} else if ( templateType === 'tag' ) {
				_taxonomy = 'post_tag';
			} else if ( templateType === 'taxonomy' && templateQuery ) {
				// Templates for specific term slugs still need to be split.
				const [ taxSlug ] = templateQuery.split( '-', 1 );
				_taxonomy = taxSlug;
			}
		}

		// As a last resort, use the fallback taxonomy.
		if ( ! _taxonomy ) {
			_taxonomy = FALLBACK_TAXONOMY;
		}

		let _inheritContext = queryContextContext || '';
		if ( ! _inheritContext && ! queryContext && inherit ) {
			if ( postId || isSingular ) {
				_inheritContext = 'post';
			} else if (
				templateType === 'taxonomy' ||
				templateType === _taxonomy ||
				termIdContext
			) {
				_inheritContext = 'taxonomy_archive';
			}
		}

		return {
			taxonomy: _taxonomy,
			inheritContext: _inheritContext,
		};
	}, [
		contextTaxonomy,
		queryContext,
		queryContextContext,
		queryContextTaxonomy,
		inherit,
		initialTaxonomy,
		templateSlug,
		postId,
		termIdContext,
	] );

	/**
	 * The termQuery context is not declared in the block.json file's
	 * `providesContext` property so that we can control the value without
	 * being beholden to the block's attribute value, which could be empty.
	 */
	const termQueryContextObject = useMemo( () => {
		return {
			termQuery: {
				...termQuery,
				parent,
				taxonomy,
				context: inheritContext,
			},
		};
	}, [ termQuery, parent, taxonomy, inheritContext ] );

	const setQuery = useCallback(
		( newQuery ) => {
			setAttributes( {
				termQuery: {
					...termQuery,
					...newQuery,
				},
			} );
		},
		[ termQuery, setAttributes ]
	);

	useEffect( () => {
		// If there is no termQueryId, the block has been newly inserted or reset.
		if ( ! termQueryId ) {
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( { termQueryId: instanceId } );

			// Default to inheriting the query if the block is nested and inherit is undefined.
			const shouldInherit =
				inherit === undefined ? !! termIdContext : inherit;

			if ( shouldInherit ) {
				setQuery( { inherit: true } );
			}
		}
	}, [
		termQueryId,
		instanceId,
		__unstableMarkNextChangeAsNotPersistent,
		setAttributes,
		inherit,
		termIdContext,
		setQuery,
	] );

	/**
	 * Because the termQuery attribute is an object with defaults, there are
	 * certain properties that need to be set or removed if inherit is true,
	 * either on mount or when the inherit flag changes.
	 */
	useEffect( () => {
		if ( inherit && initialTaxonomy ) {
			__unstableMarkNextChangeAsNotPersistent();
			const inheritedTermQuery = {
				...termQuery,
			};

			// Remove parent and taxonomy so they can be derived from context instead.
			delete inheritedTermQuery.parent;
			delete inheritedTermQuery.taxonomy;

			setAttributes( { termQuery: inheritedTermQuery } );
		}
	}, [
		inherit,
		initialTaxonomy,
		__unstableMarkNextChangeAsNotPersistent,
		termQuery,
		setAttributes,
	] );

	return (
		<>
			<TermsQueryInspectorControls
				{ ...props }
				attributes={ {
					...attributes,
					// Pass context-derived termQuery for controls to use.
					termQuery: termQueryContextObject.termQuery,
				} }
				setQuery={ setQuery }
			/>
			<BlockContextProvider value={ termQueryContextObject }>
				<TagName { ...innerBlocksProps } />
			</BlockContextProvider>
		</>
	);
}
