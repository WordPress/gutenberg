/**
 * External dependencies
 */
import { groupBy, deburr, flatten } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { parse } from '@wordpress/blocks';
import { useMemo, useCallback } from '@wordpress/element';
import { ENTER, SPACE } from '@wordpress/keycodes';
import { __, sprintf } from '@wordpress/i18n';
import { BlockPreview } from '@wordpress/block-editor';
import {
	__unstableComposite as Composite,
	__unstableCompositeItem as CompositeItem,
	Icon,
	__unstableUseCompositeState as useCompositeState,
} from '@wordpress/components';
import { useAsyncList } from '@wordpress/compose';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { createTemplatePartId } from '../utils/create-template-part-id';

function getAreaGroupTitle( areaLabel ) {
	return sprintf(
		// Translators: %s for the area the template part is assigned to (Header, Footer, General, etc.)
		__( 'Area: %s' ),
		areaLabel
	);
}
function PreviewPlaceholder() {
	return (
		<div
			className="wp-block-template-part__selection-preview-item is-placeholder"
			tabIndex={ 0 }
		/>
	);
}

function TemplatePartItem( {
	templatePart,
	setAttributes,
	onClose,
	composite,
} ) {
	const {
		slug,
		theme,
		title: { rendered: title },
	} = templatePart;
	// The 'raw' property is not defined for a brief period in the save cycle.
	// The fallback prevents an error in the parse function while saving.
	const content = templatePart.content.raw || '';
	const blocks = useMemo( () => parse( content ), [ content ] );
	const { createSuccessNotice } = useDispatch( noticesStore );

	const onClick = useCallback( () => {
		setAttributes( { slug, theme, area: undefined } );
		createSuccessNotice(
			sprintf(
				/* translators: %s: template part title. */
				__( 'Template Part "%s" inserted.' ),
				title || slug
			),
			{
				type: 'snackbar',
			}
		);
		onClose();
	}, [ slug, theme ] );

	return (
		<CompositeItem
			as="div"
			className="wp-block-template-part__selection-preview-item"
			role="option"
			onClick={ onClick }
			onKeyDown={ ( event ) => {
				if ( ENTER === event.keyCode || SPACE === event.keyCode ) {
					onClick();
				}
			} }
			tabIndex={ 0 }
			aria-label={ title || slug }
			{ ...composite }
		>
			<BlockPreview blocks={ blocks } />
			<div className="wp-block-template-part__selection-preview-item-title">
				{ title || slug }
			</div>
		</CompositeItem>
	);
}

function PanelGroup( { title, icon, children } ) {
	return (
		<>
			<div className="wp-block-template-part__selection-panel-group-header">
				<span className="wp-block-template-part__selection-panel-group-title">
					{ title }
				</span>
				<Icon icon={ icon } />
			</div>
			<div className="wp-block-template-part__selection-panel-group-content">
				{ children }
			</div>
		</>
	);
}

function TemplatePartsByArea( {
	templateParts,
	setAttributes,
	onClose,
	composite,
	area = 'uncategorized',
	labelsByArea,
} ) {
	const { templatePartsByArea, templatePartsToShow } = useMemo( () => {
		const _templatePartsToShow =
			templateParts.filter(
				( templatePart ) =>
					'uncategorized' === area || templatePart.area === area
			) || [];
		const _templatePartsByArea = Object.values(
			groupBy( _templatePartsToShow, 'area' )
		);
		const orderedTemplatePartsToShow = flatten( _templatePartsToShow );
		return {
			templatePartsByArea: _templatePartsByArea,
			templatePartsToShow: orderedTemplatePartsToShow,
		};
	}, [ templateParts, area ] );

	const currentShownTPs = useAsyncList( templatePartsToShow );

	if ( ! templatePartsToShow.length ) {
		return (
			<PanelGroup
				title={ getAreaGroupTitle(
					labelsByArea[ area ] || labelsByArea.uncategorized
				) }
			>
				{ sprintf(
					// Translators: %s for the template part variation ("Header", "Footer", "Template Part").
					__(
						'There is no other %s available. If you are looking for another type of template part, try searching for it using the input above.'
					),
					area && area !== 'uncategorized'
						? labelsByArea[ area ] || area
						: __( 'Template Part' )
				) }
			</PanelGroup>
		);
	}

	return templatePartsByArea.map( ( templatePartList ) => {
		return (
			<PanelGroup
				key={ templatePartList[ 0 ].area }
				title={ getAreaGroupTitle(
					labelsByArea[ templatePartList[ 0 ].area ] ||
						labelsByArea.uncategorized
				) }
			>
				{ templatePartList.map( ( templatePart ) => {
					return currentShownTPs.includes( templatePart ) ? (
						<TemplatePartItem
							key={ templatePart.id }
							templatePart={ templatePart }
							setAttributes={ setAttributes }
							onClose={ onClose }
							composite={ composite }
						/>
					) : (
						<PreviewPlaceholder key={ templatePart.id } />
					);
				} ) }
			</PanelGroup>
		);
	} );
}

function TemplatePartSearchResults( {
	templateParts,
	setAttributes,
	filterValue,
	onClose,
	composite,
	labelsByArea,
} ) {
	const { filteredTPs, groupedResults } = useMemo( () => {
		// Filter based on value.
		// Remove diacritics and convert to lowercase to normalize.
		const normalizedFilterValue = deburr( filterValue ).toLowerCase();
		const searchResults = templateParts.filter(
			( { title: { rendered: title }, area } ) =>
				deburr( title )
					.toLowerCase()
					.includes( normalizedFilterValue ) ||
				// Since diacritics can be used in theme names, remove them for the comparison.
				deburr( labelsByArea[ area ] )
					.toLowerCase()
					.includes( normalizedFilterValue )
		);
		// Order based on value location.
		searchResults.sort( ( a, b ) => {
			// First prioritize index found in title.
			// Deburr for diacritics.
			const indexInTitleA = deburr( a.title.rendered )
				.toLowerCase()
				.indexOf( normalizedFilterValue );
			const indexInTitleB = deburr( b.title.rendered )
				.toLowerCase()
				.indexOf( normalizedFilterValue );
			if ( indexInTitleA !== -1 && indexInTitleB !== -1 ) {
				return indexInTitleA - indexInTitleB;
			} else if ( indexInTitleA !== -1 ) {
				return -1;
			} else if ( indexInTitleB !== -1 ) {
				return 1;
			}
			// Second prioritize index found in area.
			return (
				deburr( labelsByArea[ a.area ] )
					.toLowerCase()
					.indexOf( normalizedFilterValue ) -
				deburr( labelsByArea[ b.area ] )
					.toLowerCase()
					.indexOf( normalizedFilterValue )
			);
		} );
		// Group filtered results together if their neighbors share the same area.
		// This helps not show redundant panel groups side by side in the results.
		const _groupedResults = [];
		for ( let i = 0; i < searchResults.length; i++ ) {
			if (
				i !== 0 &&
				searchResults[ i ].area === searchResults[ i - 1 ].area
			) {
				_groupedResults[ _groupedResults.length - 1 ].push(
					searchResults[ i ]
				);
			} else {
				_groupedResults.push( [ searchResults[ i ] ] );
			}
		}
		return {
			filteredTPs: searchResults,
			groupedResults: _groupedResults,
		};
	}, [ filterValue, templateParts ] );

	const currentShownTPs = useAsyncList( filteredTPs );

	return groupedResults.map( ( group ) => (
		<PanelGroup
			key={ group[ 0 ].id }
			title={ getAreaGroupTitle(
				labelsByArea[ group[ 0 ].area ] || labelsByArea.uncategorized
			) }
		>
			{ group.map( ( templatePart ) =>
				currentShownTPs.includes( templatePart ) ? (
					<TemplatePartItem
						key={ templatePart.id }
						templatePart={ templatePart }
						setAttributes={ setAttributes }
						onClose={ onClose }
						composite={ composite }
					/>
				) : (
					<PreviewPlaceholder key={ templatePart.id } />
				)
			) }
		</PanelGroup>
	) );
}

export default function TemplatePartPreviews( {
	setAttributes,
	filterValue,
	onClose,
	area,
	templatePartId,
} ) {
	const composite = useCompositeState();

	const { templateParts, labelsByArea } = useSelect( ( select ) => {
		const _templateParts = (
			select( coreStore ).getEntityRecords(
				'postType',
				'wp_template_part',
				{
					per_page: -1,
				}
			) || []
		).filter(
			( templatePart ) =>
				createTemplatePartId(
					templatePart.theme,
					templatePart.slug
				) !== templatePartId
		);

		// FIXME: @wordpress/block-library should not depend on @wordpress/editor.
		// Blocks can be loaded into a *non-post* block editor.
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		const definedAreas = select(
			'core/editor'
		).__experimentalGetDefaultTemplatePartAreas();
		const _labelsByArea = {};
		definedAreas.forEach( ( item ) => {
			_labelsByArea[ item.area ] = item.label;
		} );

		return {
			templateParts: _templateParts,
			labelsByArea: _labelsByArea,
		};
	}, [] );

	if ( ! templateParts || ! templateParts.length ) {
		return (
			<PanelGroup>
				{ __( 'There are no existing template parts to select.' ) }
			</PanelGroup>
		);
	}

	if ( filterValue ) {
		return (
			<Composite
				{ ...composite }
				role="listbox"
				aria-label={ __( 'List of template parts' ) }
			>
				<TemplatePartSearchResults
					templateParts={ templateParts }
					setAttributes={ setAttributes }
					filterValue={ filterValue }
					onClose={ onClose }
					composite={ composite }
					labelsByArea={ labelsByArea }
				/>
			</Composite>
		);
	}

	return (
		<Composite
			{ ...composite }
			role="listbox"
			aria-label={ __( 'List of template parts' ) }
		>
			<TemplatePartsByArea
				templateParts={ templateParts }
				setAttributes={ setAttributes }
				onClose={ onClose }
				composite={ composite }
				area={ area }
				labelsByArea={ labelsByArea }
			/>
		</Composite>
	);
}
