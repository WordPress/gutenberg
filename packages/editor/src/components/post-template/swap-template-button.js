/**
 * WordPress dependencies
 */
import { useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import {
	BlockPreview,
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	Composite,
	MenuItem,
	Modal,
	SearchControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { parse } from '@wordpress/blocks';
import {
	mergeGlobalStyles,
	generateGlobalStyles,
} from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { useAvailableTemplates, useEditedPostContext } from './hooks';
import { searchTemplates } from '../../utils/search-templates';
import { unlock } from '../../lock-unlock';

const { ExperimentalBlockEditorProvider } = unlock( blockEditorPrivateApis );

export default function SwapTemplateButton( { onClick } ) {
	const [ showModal, setShowModal ] = useState( false );
	const { postType, postId } = useEditedPostContext();
	const availableTemplates = useAvailableTemplates( postType );
	const { editEntityRecord } = useDispatch( coreStore );

	const onTemplateSelect = async ( template ) => {
		editEntityRecord(
			'postType',
			postType,
			postId,
			{ template: template.name },
			{ undoIgnore: true }
		);
		setShowModal( false ); // Close the template suggestions modal first.
		onClick();
	};
	return (
		<>
			<MenuItem
				disabled={ ! availableTemplates?.length }
				accessibleWhenDisabled
				onClick={ () => setShowModal( true ) }
			>
				{ __( 'Change template' ) }
			</MenuItem>
			{ showModal && (
				<Modal
					title={ __( 'Choose a template' ) }
					onRequestClose={ () => setShowModal( false ) }
					overlayClassName="editor-post-template__swap-template-modal"
					isFullScreen
				>
					<div className="editor-post-template__swap-template-modal-content">
						<TemplatesList
							postType={ postType }
							onSelect={ onTemplateSelect }
						/>
					</div>
				</Modal>
			) }
		</>
	);
}

/**
 * Hook to get block editor settings with optional style variation override.
 *
 * When a template has an associated style variation, this hook merges the
 * variation's styles with the default base config to generate the correct
 * preview styles. Uses the default theme base config (not the current
 * template's base-theme-merged config) so each preview is independent.
 *
 * @param {string|null} styleVariationId The style variation ID, or null for default.
 * @return {Object} Settings object for BlockEditorProvider.
 */
function useSettingsWithVariation( styleVariationId ) {
	const parentSettings = useSelect(
		( select ) => select( blockEditorStore ).getSettings(),
		[]
	);

	// Get the default theme base config directly, independent of any
	// current template's variation context.
	const defaultBaseConfig = useSelect(
		( select ) =>
			select(
				coreStore
			).__experimentalGetCurrentThemeBaseGlobalStyles() || {},
		[]
	);

	// Get the default user (global styles) config.
	const defaultUserConfig = useSelect( ( select ) => {
		const globalStylesId = select(
			coreStore
		).__experimentalGetCurrentGlobalStylesId();
		if ( ! globalStylesId ) {
			return {};
		}
		const record = select( coreStore ).getEditedEntityRecord(
			'root',
			'globalStyles',
			globalStylesId
		);
		return {
			settings: record?.settings ?? {},
			styles: record?.styles ?? {},
		};
	}, [] );

	// Get registered variation to find its post_id (if any).
	const registeredVariation = useSelect(
		( select ) => {
			if ( ! styleVariationId ) {
				return null;
			}

			const getRegisteredVariations =
				select( coreStore ).__experimentalGetRegisteredStyleVariations;
			if ( typeof getRegisteredVariations !== 'function' ) {
				return null;
			}

			const variations = getRegisteredVariations() || [];
			return (
				variations.find( ( v ) => v.id === styleVariationId ) || null
			);
		},
		[ styleVariationId ]
	);

	// If the variation has a post, fetch the post's styles (edited version).
	const variationPostData = useSelect(
		( select ) => {
			const postId = registeredVariation?.post_id;
			if ( ! postId ) {
				return null;
			}

			const { getEntityRecord } = select( coreStore );
			const record = getEntityRecord( 'root', 'globalStyles', postId );

			if ( ! record ) {
				return null;
			}

			return {
				settings: record.settings || {},
				styles: record.styles || {},
			};
		},
		[ registeredVariation?.post_id ]
	);

	// Use post data if available, otherwise fall back to registered variation data.
	const effectiveVariationData = useMemo( () => {
		if ( variationPostData ) {
			return variationPostData;
		}
		if ( registeredVariation ) {
			return {
				settings: registeredVariation.settings || {},
				styles: registeredVariation.styles || {},
			};
		}
		return null;
	}, [ variationPostData, registeredVariation ] );

	// Default merged config (base + user global styles, no variation).
	const defaultMergedConfig = useMemo(
		() => mergeGlobalStyles( defaultBaseConfig, defaultUserConfig ),
		[ defaultBaseConfig, defaultUserConfig ]
	);

	// Generate base global styles (no variation) for the default case.
	const [ baseGlobalStyles, baseGlobalSettings ] = useMemo( () => {
		return generateGlobalStyles( defaultMergedConfig, [], {
			disableRootPadding: false,
		} );
	}, [ defaultMergedConfig ] );

	// Build settings, overriding styles when a variation is active.
	const settings = useMemo( () => {
		const base = {
			...parentSettings,
			styles: baseGlobalStyles,
			__experimentalFeatures: baseGlobalSettings,
			isPreviewMode: true,
		};

		if ( ! effectiveVariationData ) {
			return base;
		}

		// Merge variation styles with the default base config.
		const variationMergedConfig = mergeGlobalStyles(
			defaultBaseConfig,
			effectiveVariationData
		);

		// Generate CSS from merged config.
		const [ globalStyles, globalSettings ] = generateGlobalStyles(
			variationMergedConfig,
			[],
			{ disableRootPadding: false }
		);

		return {
			...base,
			styles: globalStyles,
			__experimentalFeatures: globalSettings,
		};
	}, [
		parentSettings,
		baseGlobalStyles,
		baseGlobalSettings,
		effectiveVariationData,
		defaultBaseConfig,
	] );

	return settings;
}

function TemplatePreviewItem( { template, onClick } ) {
	const styleVariationId = template.style_variation || null;
	const settings = useSettingsWithVariation( styleVariationId );

	const blocks = useMemo( () => {
		return parse( template.content.raw );
	}, [ template.content.raw ] );

	const isEmpty = ! blocks?.length;
	const title = decodeEntities( template.title.rendered );

	return (
		<Composite.Item
			render={
				<div
					role="option"
					aria-label={ title }
					className="block-editor-block-patterns-list__item"
				/>
			}
			id={ template.slug }
			onClick={ () =>
				onClick( {
					name: template.slug,
					blocks,
					title,
					id: template.id,
				} )
			}
		>
			{ isEmpty && __( 'Empty template' ) }
			{ ! isEmpty && (
				<ExperimentalBlockEditorProvider
					value={ blocks }
					settings={ settings }
				>
					<BlockPreview.Async>
						<BlockPreview blocks={ blocks } />
					</BlockPreview.Async>
				</ExperimentalBlockEditorProvider>
			) }
			<div className="block-editor-block-patterns-list__item-title">
				{ title }
			</div>
		</Composite.Item>
	);
}

function TemplatesList( { postType, onSelect } ) {
	const [ searchValue, setSearchValue ] = useState( '' );
	const availableTemplates = useAvailableTemplates( postType );
	const templatesAsPatterns = useMemo(
		() =>
			availableTemplates.map( ( template ) => ( {
				name: template.slug,
				blocks: parse( template.content.raw ),
				title: decodeEntities( template.title.rendered ),
				id: template.id,
			} ) ),
		[ availableTemplates ]
	);

	const filteredTemplates = useMemo( () => {
		const filtered = searchTemplates( templatesAsPatterns, searchValue );
		// Map back to original template objects by slug.
		const filteredSlugs = new Set( filtered.map( ( p ) => p.name ) );
		return availableTemplates.filter( ( t ) =>
			filteredSlugs.has( t.slug )
		);
	}, [ templatesAsPatterns, availableTemplates, searchValue ] );

	return (
		<>
			<SearchControl
				onChange={ setSearchValue }
				value={ searchValue }
				label={ __( 'Search' ) }
				placeholder={ __( 'Search' ) }
				className="editor-post-template__swap-template-search"
			/>
			<Composite
				role="listbox"
				className="block-editor-block-patterns-list"
				aria-label={ __( 'Templates' ) }
			>
				{ filteredTemplates.map( ( template ) => (
					<div
						key={ template.slug }
						className="block-editor-block-patterns-list__list-item"
					>
						<TemplatePreviewItem
							template={ template }
							onClick={ onSelect }
						/>
					</div>
				) ) }
			</Composite>
		</>
	);
}
