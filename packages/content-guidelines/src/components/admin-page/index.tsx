/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	Spinner,
	Notice,
	Button,
	__experimentalVStack as VStack,
} from '@wordpress/components';
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
import CategoryRow from './category-row';
import BlockGuidelinesRow from './block-guidelines-row';
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
			"Describe your site's purpose, goals, and primary audience. This helps creators develop content that resonates with your readers."
		),
	},
	{
		slug: 'copy',
		label: __( 'Copy Guidelines' ),
		description: __(
			'Set your writing standards for tone, voice, style, and formatting. Include brand terminology and content to avoid so all writing stays consistent.'
		),
	},
	{
		slug: 'images',
		label: __( 'Image Guidelines' ),
		description: __(
			'Outline your style, subject matter, technical requirements (dimensions, formats), mood and aesthetic preferences, and images to avoid. This ensures consistent, accessible imagery.'
		),
	},
	{
		slug: 'blocks',
		label: __( 'Block-Specific Guidelines' ),
		description: __(
			'Create tailored guidelines for specific block types (headings, images, quotes, etc.). This allows you to set unique standards for how different blocks are treated.'
		),
	},
	{
		slug: 'other',
		label: __( 'Additional Guidelines' ),
		description: __(
			'Include any additional standards such as SEO preferences, legal requirements, citation styles, or other content considerations.'
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
					<h1 className="wp-heading-inline">
						{ __( 'Content Guidelines' ) }
					</h1>
					<p className="description">
						{ __(
							"Set content standards that guide your team, inform plugins, and help AI tools generate content that matches your site's voice and requirements."
						) }
					</p>
				</div>
			</header>

			{ error && (
				<Notice status="error" isDismissible={ false }>
					{ error }
				</Notice>
			) }

			<div className="content-guidelines-admin__layout">
				<main className="content-guidelines-admin__main">
					<VStack spacing={ 0 }>
						{ CATEGORIES.map( ( category ) => {
							if ( category.slug === 'blocks' ) {
								return (
									<BlockGuidelinesRow
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
										description={ category.description }
									/>
								);
							}

							const categoryData = guidelines
								?.guideline_categories?.[ category.slug ] as
								| { guidelines?: string }
								| undefined;

							return (
								<CategoryRow
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
								/>
							);
						} ) }
					</VStack>
					<p className="submit">
						<Button
							variant="primary"
							onClick={ () => handleSave() }
							isBusy={ isSavingData }
							disabled={ ! isDirtyData || isSavingData }
							accessibleWhenDisabled
							__next40pxDefaultSize
						>
							{ isSavingData
								? __( 'Saving…' )
								: __( 'Save Changes' ) }
						</Button>
					</p>
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
