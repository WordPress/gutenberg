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

/**
 * Internal dependencies
 */
import useAsyncList from './use-async-list';

/**
 * External dependencies
 */
import { groupBy } from 'lodash';

function TemplatePartPlaceholder() {
	return (
		<div className="wp-block-template-part__placeholder-preview-item is-placeholder" />
	);
}

function TemplatePartItem( { templatePart, selectTemplate } ) {
	const { id, slug, theme } = templatePart;
	// The 'raw' property is not defined for a brief period in the save cycle.
	// The fallback prevents an error in the parse function while saving.
	const content = templatePart.content.raw || '';
	const blocks = useMemo( () => parse( content ), [ content ] );
	const { createSuccessNotice } = useDispatch( 'core/notices' );

	const onClick = useCallback( () => {
		selectTemplate( { postId: id, slug, theme } );
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
	}, [ id, slug, theme ] );

	return (
		<div
			className="wp-block-template-part__placeholder-preview-item"
			role="button"
			onClick={ onClick }
			onKeyDown={ ( event ) => {
				if ( ENTER === event.keyCode || SPACE === event.keyCode ) {
					onClick();
				}
			} }
			tabIndex={ 0 }
			aria-label={ templatePart.slug }
		>
			<BlockPreview blocks={ blocks } />
			<div className="wp-block-template-part__placeholder-preview-item-title">
				{ templatePart.slug }
			</div>
		</div>
	);
}

function PanelGroup( { title, icon, children } ) {
	return (
		<>
			<div className="wp-block-template-part__placeholder-panel-group-header">
				<span className="wp-block-template-part__placeholder-panel-group-title">
					{ title }
				</span>
				<Icon icon={ icon } />
			</div>
			<div className="wp-block-template-part__placeholder-panel-group-content">
				{ children }
			</div>
		</>
	);
}

function TemplatePartsByTheme( { templateParts, selectTemplate } ) {
	const templatePartsByTheme = useMemo( () => {
		return Object.values( groupBy( templateParts, 'meta.theme' ) );
	}, [ templateParts ] );
	const currentShownTPs = useAsyncList( templateParts );

	return (
		<>
			{ templatePartsByTheme.length &&
				templatePartsByTheme.map( ( templatePartList ) => (
					<PanelGroup
						key={ templatePartList[ 0 ].meta.theme }
						title={ templatePartList[ 0 ].meta.theme }
					>
						{ templatePartList.map( ( templatePart ) => {
							return currentShownTPs.includes( templatePart ) ? (
								<TemplatePartItem
									key={ templatePart.id }
									templatePart={ templatePart }
									selectTemplate={ selectTemplate }
								/>
							) : (
								<TemplatePartPlaceholder
									key={ templatePart.id }
								/>
							);
						} ) }
					</PanelGroup>
				) ) }
		</>
	);
}

function TemplatePartSearchResults( {
	templateParts,
	selectTemplate,
	filterValue,
} ) {
	const filteredTPs = useMemo( () => {
		// Filter based on value.
		const lowerFilterValue = filterValue.toLowerCase();
		const searchResults = templateParts.filter(
			( { slug, meta: { theme } } ) =>
				slug.toLowerCase().includes( lowerFilterValue ) ||
				theme.toLowerCase().includes( lowerFilterValue )
		);
		// Order based on value location.
		searchResults.sort( ( a, b ) => {
			// First prioritize index found in slug.
			const indexInSlugA = a.slug
				.toLowerCase()
				.indexOf( lowerFilterValue );
			const indexInSlugB = b.slug
				.toLowerCase()
				.indexOf( lowerFilterValue );
			if ( indexInSlugA !== -1 && indexInSlugB !== -1 ) {
				return indexInSlugA - indexInSlugB;
			} else if ( indexInSlugA !== -1 ) {
				return -1;
			} else if ( indexInSlugB !== -1 ) {
				return 1;
			}
			// Second prioritize index found in theme.
			return (
				a.meta.theme.toLowerCase().indexOf( lowerFilterValue ) -
				b.meta.theme.toLowerCase().indexOf( lowerFilterValue )
			);
		} );
		return searchResults;
	}, [ filterValue, templateParts ] );

	const currentShownTPs = useAsyncList( filteredTPs );

	return (
		<>
			{ filteredTPs.map( ( templatePart ) => (
				<PanelGroup
					key={ templatePart.id }
					title={ templatePart.meta.theme }
				>
					{ currentShownTPs.includes( templatePart ) ? (
						<TemplatePartItem
							key={ templatePart.id }
							templatePart={ templatePart }
							selectTemplate={ selectTemplate }
						/>
					) : (
						<TemplatePartPlaceholder key={ templatePart.id } />
					) }
				</PanelGroup>
			) ) }
		</>
	);
}

export default function TemplateParts( { selectTemplate, filterValue } ) {
	const templateParts = useSelect( ( select ) => {
		return select( 'core' ).getEntityRecords(
			'postType',
			'wp_template_part',
			{
				status: [ 'publish', 'auto-draft' ],
			}
		);
	}, [] );

	if ( ! templateParts || ! templateParts.length ) {
		return null;
	}

	if ( filterValue ) {
		return (
			<TemplatePartSearchResults
				templateParts={ templateParts }
				selectTemplate={ selectTemplate }
				filterValue={ filterValue }
			/>
		);
	}

	return (
		<TemplatePartsByTheme
			templateParts={ templateParts }
			selectTemplate={ selectTemplate }
		/>
	);
}
