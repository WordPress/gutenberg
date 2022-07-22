/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blocksStore, cloneBlock } from '@wordpress/blocks';
import { useInstanceId } from '@wordpress/compose';
import { useState, useEffect } from '@wordpress/element';
import {
	BlockControls,
	InspectorControls,
	useBlockProps,
	useSetting,
	store as blockEditorStore,
	useInnerBlocksProps,
	__experimentalGetMatchingVariation as getMatchingVariation,
	__experimentalBlockPatternSetup as BlockPatternSetup,
} from '@wordpress/block-editor';
import {
	Button,
	SelectControl,
	Placeholder,
	Modal,
} from '@wordpress/components';
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
export function QueryContent( {
	attributes,
	setAttributes,
	openPatternSelectionModal,
	name,
	clientId,
} ) {
	const {
		queryId,
		query,
		displayLayout,
		tagName: TagName = 'div',
		layout = {},
	} = attributes;
	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
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
				clientId={ clientId }
				attributes={ attributes }
				setQuery={ updateQuery }
				setDisplayLayout={ updateDisplayLayout }
			/>
			<BlockControls>
				<QueryToolbar
					name={ name }
					clientId={ clientId }
					attributes={ attributes }
					setQuery={ updateQuery }
					setDisplayLayout={ updateDisplayLayout }
					openPatternSelectionModal={ openPatternSelectionModal }
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

function QueryPatternSetup( {
	attributes,
	clientId,
	name,
	openPatternSelectionModal,
	setAttributes,
} ) {
	const [ isStartingBlank, setIsStartingBlank ] = useState( false );
	const blockProps = useBlockProps();

	const { blockType, allVariations, hasPatterns } = useSelect(
		( select ) => {
			const { getBlockVariations, getBlockType } = select( blocksStore );
			const {
				getBlockRootClientId,
				__experimentalGetPatternsByBlockTypes,
			} = select( blockEditorStore );
			const rootClientId = getBlockRootClientId( clientId );

			return {
				blockType: getBlockType( name ),
				allVariations: getBlockVariations( name ),
				hasPatterns: !! __experimentalGetPatternsByBlockTypes(
					name,
					rootClientId
				).length,
			};
		},
		[ name, clientId ]
	);

	const matchingVariation = getMatchingVariation( attributes, allVariations );
	const icon = matchingVariation?.icon || blockType?.icon?.src;
	const label = matchingVariation?.title || blockType?.title;
	if ( isStartingBlank ) {
		return (
			<QueryPlaceholder
				clientId={ clientId }
				name={ name }
				setAttributes={ setAttributes }
				icon={ icon }
				label={ label }
			/>
		);
	}
	return (
		<div { ...blockProps }>
			<Placeholder
				icon={ icon }
				label={ label }
				instructions={ __(
					'Choose a pattern for the query loop or start blank.'
				) }
			>
				{ !! hasPatterns && (
					<Button
						variant="primary"
						onClick={ openPatternSelectionModal }
					>
						{ __( 'Choose' ) }
					</Button>
				) }

				<Button
					variant="secondary"
					onClick={ () => {
						setIsStartingBlank( true );
					} }
				>
					{ __( 'Start blank' ) }
				</Button>
			</Placeholder>
		</div>
	);
}

const QueryEdit = ( props ) => {
	const { clientId, name } = props;
	const [ isPatternSelectionModalOpen, setIsPatternSelectionModalOpen ] =
		useState( false );
	const { replaceBlock, selectBlock } = useDispatch( blockEditorStore );
	const hasInnerBlocks = useSelect(
		( select ) =>
			!! select( blockEditorStore ).getBlocks( clientId ).length,
		[ clientId ]
	);
	const Component = hasInnerBlocks ? QueryContent : QueryPatternSetup;
	const onBlockPatternSelect = ( blocks ) => {
		const clonedBlocks = blocks.map( ( block ) => cloneBlock( block ) );
		const firstQueryClientId =
			getFirstQueryClientIdFromBlocks( clonedBlocks );
		replaceBlock( clientId, clonedBlocks );
		if ( firstQueryClientId ) {
			selectBlock( firstQueryClientId );
		}
	};
	return (
		<>
			<Component
				{ ...props }
				openPatternSelectionModal={ () =>
					setIsPatternSelectionModalOpen( true )
				}
			/>
			{ isPatternSelectionModalOpen && (
				<Modal
					className="block-editor-query-pattern__selection-modal"
					title={ __( 'Choose a pattern' ) }
					closeLabel={ __( 'Cancel' ) }
					onRequestClose={ () =>
						setIsPatternSelectionModalOpen( false )
					}
				>
					<BlockPatternSetup
						blockName={ name }
						clientId={ clientId }
						onBlockPatternSelect={ onBlockPatternSelect }
					/>
				</Modal>
			) }
		</>
	);
};

export default QueryEdit;
