/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { Panel, Spinner, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { store } from '../../store';
import type {
	BlockGuidelines,
	GuidelineCategories,
} from '../../store/constants';
import CategoryPanel from './category-panel';
import BlockGuidelinesPanel from './block-guidelines-panel';
import PublishControls from './publish-controls';
import RevisionList from './revision-list';
import ImportExportControls from './import-export-controls';

interface Category {
	slug: keyof GuidelineCategories;
	label: string;
	description: string;
}

const CATEGORIES: Category[] = [
	{
		slug: 'site',
		label: __( 'Site Context' ),
		description: __(
			'Describe your site goals, target audience, and overall content strategy.'
		),
	},
	{
		slug: 'copy',
		label: __( 'Copy Guidelines' ),
		description: __(
			'Describe your tone, voice, brand personality, and writing style preferences.'
		),
	},
	{
		slug: 'images',
		label: __( 'Image Guidelines' ),
		description: __(
			'Describe preferred image styles, colors, compositions, and visual aesthetics.'
		),
	},
	{
		slug: 'blocks',
		label: __( 'Block-Specific Guidelines' ),
		description: __( 'Per-block rules for specific content types.' ),
	},
	{
		slug: 'other',
		label: __( 'Other Guidelines' ),
		description: __(
			'Any other AI content preferences or special instructions.'
		),
	},
];

export default function AdminPage() {
	const { guidelines, isLoadingData, isSavingData, isDirtyData, error } =
		useSelect( ( select ) => {
			const storeSelectors = select( store );
			return {
				guidelines: storeSelectors.getGuidelines(),
				isLoadingData: storeSelectors.isLoading(),
				isSavingData: storeSelectors.isSaving(),
				isDirtyData: storeSelectors.isDirty(),
				error: storeSelectors.getError(),
			};
		}, [] );

	const { fetchGuidelines, saveGuidelines, updateCategory, setStatus } =
		useDispatch( store );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	useEffect( () => {
		fetchGuidelines();
	}, [ fetchGuidelines ] );

	const handleSave = async ( targetStatus?: 'draft' | 'published' ) => {
		if ( ! guidelines ) {
			return;
		}

		// If targetStatus provided, update status before saving
		if ( targetStatus && targetStatus !== guidelines.status ) {
			setStatus( targetStatus );
		}

		try {
			await saveGuidelines( {
				...guidelines,
				status: targetStatus || guidelines.status,
			} );
			const message =
				targetStatus === 'published'
					? __( 'Guidelines published successfully.' )
					: __( 'Guidelines saved.' );
			createSuccessNotice( message, {
				type: 'snackbar',
			} );
		} catch ( err ) {
			createErrorNotice(
				( err as Error ).message || __( 'Failed to save guidelines.' ),
				{ type: 'snackbar' }
			);
		}
	};

	const handleCategoryChange = (
		category: string,
		value: string | BlockGuidelines
	) => {
		const normalizedValue =
			category === 'blocks'
				? ( value as BlockGuidelines )
				: { guidelines: value as string };
		updateCategory( category, normalizedValue );
	};

	const handleImport = (
		data: Partial< {
			status: 'draft' | 'published';
			guideline_categories: GuidelineCategories;
		} >
	) => {
		if ( data.guideline_categories ) {
			const categories = data.guideline_categories;

			(
				Object.keys( categories ) as Array< keyof GuidelineCategories >
			 ).forEach( ( key ) => {
				updateCategory( key, categories[ key ] );
			} );
		}

		if ( data.status ) {
			setStatus( data.status );
		}
	};

	if ( isLoadingData ) {
		return (
			<div className="content-guidelines-admin content-guidelines-admin--loading">
				<Spinner />
				<p>{ __( 'Loading guidelines…' ) }</p>
			</div>
		);
	}

	return (
		<div className="content-guidelines-admin">
			<header className="content-guidelines-admin__header">
				<div className="content-guidelines-admin__title-section">
					<h1>{ __( 'Content Guidelines' ) }</h1>
					<p className="content-guidelines-admin__description">
						{ __(
							'Define editorial guidelines that inform AI-generated content across your site.'
						) }
					</p>
				</div>
			</header>

			{ error && (
				<Notice status="error" isDismissible={ false }>
					{ error }
				</Notice>
			) }

			<PublishControls
				status={ guidelines?.status || 'draft' }
				isDirty={ isDirtyData }
				isSaving={ isSavingData }
				onSave={ handleSave }
			/>

			<div className="content-guidelines-admin__layout">
				<main className="content-guidelines-admin__main">
					<Panel className="content-guidelines-admin__panel">
						{ CATEGORIES.map( ( category, index ) => {
							if ( category.slug === 'blocks' ) {
								return (
									<BlockGuidelinesPanel
										key={ category.slug }
										value={
											guidelines?.guideline_categories
												?.blocks || {}
										}
										onChange={ ( blocksValue ) =>
											handleCategoryChange(
												'blocks',
												blocksValue
											)
										}
									/>
								);
							}

							const categoryData = guidelines
								?.guideline_categories?.[ category.slug ] as
								| { guidelines?: string }
								| undefined;

							return (
								<CategoryPanel
									key={ category.slug }
									label={ category.label }
									description={ category.description }
									value={ categoryData?.guidelines || '' }
									onChange={ ( categoryValue ) =>
										handleCategoryChange(
											category.slug,
											categoryValue
										)
									}
									initialOpen={ index === 0 }
								/>
							);
						} ) }
					</Panel>
				</main>
				<aside className="content-guidelines-admin__sidebar">
					<RevisionList
						postId={ guidelines?.id }
						onRestore={ handleImport }
					/>
					<ImportExportControls
						guidelines={ guidelines }
						onImport={ handleImport }
					/>
				</aside>
			</div>
		</div>
	);
}
