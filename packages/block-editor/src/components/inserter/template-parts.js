/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { parse, createBlock } from '@wordpress/blocks';
import { useMemo, useCallback } from '@wordpress/element';
import { ENTER, SPACE } from '@wordpress/keycodes';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import BlockPreview from '../block-preview';
import InserterPanel from './panel';

/**
 * External dependencies
 */
import { groupBy } from 'lodash';

function TemplatePartItem( { templatePart, onInsert } ) {
	const { id, slug, theme } = templatePart;
	const content = templatePart.content.raw || '';
	const blocks = useMemo( () => parse( content ), [ content ] );
	const { createSuccessNotice } = useDispatch( 'core/notices' );

	const onClick = useCallback( () => {
		const templatePartBlock = createBlock( 'core/template-part', {
			postId: id,
			slug,
			theme,
		} );
		onInsert( templatePartBlock );
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
			className="block-editor-inserter__template-part-item"
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
			<div className="block-editor-inserter__template-part-item-title">
				{ templatePart.slug }
			</div>
		</div>
	);
}

function TemplatePartsByTheme( { templateParts, onInsert } ) {
	// Group by Theme.
	const templatePartsByTheme = useMemo( () => {
		return Object.values( groupBy( templateParts, 'meta.theme' ) );
	}, [ templateParts ] );

	return (
		<>
			{ templatePartsByTheme.length &&
				templatePartsByTheme.map( ( templatePartList ) => (
					<InserterPanel
						key={ templatePartList[ 0 ].meta.theme }
						title={ templatePartList[ 0 ].meta.theme }
					>
						{ templatePartList.map( ( templatePart ) => (
							<TemplatePartItem
								key={ templatePart.id }
								templatePart={ templatePart }
								onInsert={ onInsert }
							/>
						) ) }
					</InserterPanel>
				) ) }
		</>
	);
}

function TemplatePartSearchResults( { templateParts, onInsert, filterValue } ) {
	const filteredTPs = useMemo( () => {
		// Filter based on value.
		const lowerFilterValue = filterValue.toLowerCase();
		const thing = templateParts.filter(
			( { slug, meta: { theme } } ) =>
				slug.toLowerCase().includes( lowerFilterValue ) ||
				theme.toLowerCase().includes( lowerFilterValue )
		);
		// Order based on value location.
		thing.sort( ( a, b ) => {
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
		return thing;
	}, [ filterValue, templateParts ] );

	return (
		<>
			{ filteredTPs.map( ( templatePart ) => (
				<InserterPanel
					key={ templatePart.id }
					title={ templatePart.meta.theme }
				>
					<TemplatePartItem
						key={ templatePart.id }
						templatePart={ templatePart }
						onInsert={ onInsert }
					/>
				</InserterPanel>
			) ) }
		</>
	);
}

export default function TemplateParts( { onInsert, filterValue } ) {
	const templateParts = useSelect( ( select ) => {
		return select( 'core' ).getEntityRecords(
			'postType',
			'wp_template_part',
			{
				status: [ 'publish', 'auto-draft' ],
			}
		);
	}, [] );

	if ( filterValue ) {
		return (
			<TemplatePartSearchResults
				templateParts={ templateParts }
				onInsert={ onInsert }
				filterValue={ filterValue }
			/>
		);
	}

	return (
		<TemplatePartsByTheme
			templateParts={ templateParts }
			onInsert={ onInsert }
		/>
	);
}
