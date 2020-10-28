/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { parse } from '@wordpress/blocks';
import { useMemo, useCallback } from '@wordpress/element';
import { ENTER, SPACE } from '@wordpress/keycodes';
import { __, sprintf } from '@wordpress/i18n';
import { BlockPreview } from '@wordpress/block-editor';
import { Icon } from '@wordpress/components';
import { useAsyncList } from '@wordpress/compose';

/**
 * External dependencies
 */
import { groupBy, uniq, deburr } from 'lodash';
import { Composite, useCompositeState, CompositeItem } from 'reakit';

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
		id,
		slug,
		meta: { theme },
	} = templatePart;
	// The 'raw' property is not defined for a brief period in the save cycle.
	// The fallback prevents an error in the parse function while saving.
	const content = templatePart.content.raw || '';
	const blocks = useMemo( () => parse( content ), [ content ] );
	const { createSuccessNotice } = useDispatch( 'core/notices' );

	const onClick = useCallback( () => {
		setAttributes( { postId: id, slug, theme } );
		createSuccessNotice(
			sprintf(
				/* translators: %s: template part title. */
				__( 'Template Part "%s" inserted.' ),
				slug
			),
			{
				type: 'snackbar',
			}
		);
		onClose();
	}, [ id, slug, theme ] );

	return (
		<CompositeItem
			className="wp-block-template-part__selection-preview-item"
			role="option"
			onClick={ onClick }
			onKeyDown={ ( event ) => {
				if ( ENTER === event.keyCode || SPACE === event.keyCode ) {
					onClick();
				}
			} }
			tabIndex={ 0 }
			aria-label={ templatePart.slug }
			{ ...composite }
		>
			<BlockPreview blocks={ blocks } />
			<div className="wp-block-template-part__selection-preview-item-title">
				{ templatePart.slug }
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

function TemplatePartsByTheme( {
	templateParts,
	setAttributes,
	onClose,
	composite,
} ) {
	const templatePartsByTheme = useMemo( () => {
		return Object.values( groupBy( templateParts, 'meta.theme' ) );
	}, [ templateParts ] );
	const currentShownTPs = useAsyncList( templateParts );

	return templatePartsByTheme.map( ( templatePartList ) => (
		<PanelGroup
			key={ templatePartList[ 0 ].meta.theme }
			title={ templatePartList[ 0 ].meta.theme }
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
	) );
}

function TemplatePartSearchResults( {
	templateParts,
	setAttributes,
	filterValue,
	onClose,
	composite,
} ) {
	const filteredTPs = useMemo( () => {
		// Filter based on value.
		// Remove diacritics and convert to lowercase to normalize.
		const normalizedFilterValue = deburr( filterValue ).toLowerCase();
		const searchResults = templateParts.filter(
			( { slug, meta: { theme } } ) =>
				slug.toLowerCase().includes( normalizedFilterValue ) ||
				// Since diacritics can be used in theme names, remove them for the comparison.
				deburr( theme ).toLowerCase().includes( normalizedFilterValue )
		);
		// Order based on value location.
		searchResults.sort( ( a, b ) => {
			// First prioritize index found in slug.
			const indexInSlugA = a.slug
				.toLowerCase()
				.indexOf( normalizedFilterValue );
			const indexInSlugB = b.slug
				.toLowerCase()
				.indexOf( normalizedFilterValue );
			if ( indexInSlugA !== -1 && indexInSlugB !== -1 ) {
				return indexInSlugA - indexInSlugB;
			} else if ( indexInSlugA !== -1 ) {
				return -1;
			} else if ( indexInSlugB !== -1 ) {
				return 1;
			}
			// Second prioritize index found in theme.
			// Since diacritics can be used in theme names, remove them for the comparison.
			return (
				deburr( a.meta.theme )
					.toLowerCase()
					.indexOf( normalizedFilterValue ) -
				deburr( b.meta.theme )
					.toLowerCase()
					.indexOf( normalizedFilterValue )
			);
		} );
		return searchResults;
	}, [ filterValue, templateParts ] );

	const currentShownTPs = useAsyncList( filteredTPs );

	return filteredTPs.map( ( templatePart ) => (
		<PanelGroup key={ templatePart.id } title={ templatePart.meta.theme }>
			{ currentShownTPs.includes( templatePart ) ? (
				<TemplatePartItem
					key={ templatePart.id }
					templatePart={ templatePart }
					setAttributes={ setAttributes }
					onClose={ onClose }
					composite={ composite }
				/>
			) : (
				<PreviewPlaceholder key={ templatePart.id } />
			) }
		</PanelGroup>
	) );
}

export default function TemplateParts( {
	setAttributes,
	filterValue,
	onClose,
} ) {
	const composite = useCompositeState();
	const templateParts = useSelect( ( select ) => {
		const publishedTemplateParts = select( 'core' ).getEntityRecords(
			'postType',
			'wp_template_part',
			{
				status: [ 'publish' ],
				per_page: -1,
			}
		);
		const currentTheme = select( 'core' ).getCurrentTheme()?.stylesheet;

		const themeTemplateParts = select( 'core' ).getEntityRecords(
			'postType',
			'wp_template_part',
			{
				theme: currentTheme,
				status: [ 'publish', 'auto-draft' ],
				per_page: -1,
			}
		);
		const combinedTemplateParts = [];
		if ( publishedTemplateParts ) {
			combinedTemplateParts.push( ...publishedTemplateParts );
		}
		if ( themeTemplateParts ) {
			combinedTemplateParts.push( ...themeTemplateParts );
		}
		return uniq( combinedTemplateParts );
	}, [] );

	if ( ! templateParts || ! templateParts.length ) {
		return null;
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
			<TemplatePartsByTheme
				templateParts={ templateParts }
				setAttributes={ setAttributes }
				onClose={ onClose }
				composite={ composite }
			/>
		</Composite>
	);
}
