/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	AlignmentControl,
	BlockControls,
	InspectorControls,
	useBlockProps,
	Warning,
	HeadingLevelDropdown,
} from '@wordpress/block-editor';
import { ToggleControl, PanelBody, Spinner } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';

const SUPPORTED_TYPES = [ 'archive', 'search' ];

export default function QueryTitleEdit( {
	attributes: { type, level, textAlign, showPrefix, showSearchTerm },
	setAttributes,
	context: { templateSlug },
} ) {
	const TagName = `h${ level }`;
	const blockProps = useBlockProps( {
		className: classnames( 'wp-block-query-title__placeholder', {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	const templateTaxonomy = templateSlug?.split( '-' )[ 0 ];
	const { records: taxonomies } = useEntityRecords( 'root', 'taxonomy', {
		per_page: -1,
		context: 'view',
	} );

	const { taxonomyName, termName, hasResolved } = useSelect(
		( select ) => {
			if ( taxonomies && taxonomies.length > 0 ) {
				const { getEntityRecords } = select( coreStore );
				let term = __( 'Name' ); // Used for the fallback templates (e.g. archive.html, category.html).
				if (
					templateTaxonomy === 'archive' ||
					templateTaxonomy === 'author'
				) {
					// Expected format: author-admin
					term = templateSlug?.split( '-' )[ 1 ];
				} else if ( templateTaxonomy === 'taxonomy' ) {
					// Expected format for a custom taxonomy: taxonomy-posttype-term
					term = templateSlug?.split( '-' )[ 2 ];
				} else if ( templateTaxonomy === 'date' ) {
					term = __( 'Date' );
				} else if ( templateTaxonomy === '404' ) {
					// To do: this should probably be a block variation.
					term = __( 'Nothing found' );
				} else if ( templateSlug?.startsWith( templateTaxonomy ) ) {
					const terms = getEntityRecords(
						'taxonomy',
						templateTaxonomy === 'tag'
							? 'post_tag'
							: templateTaxonomy,
						{
							per_page: -1,
						}
					);
					if ( terms ) {
						terms.forEach( ( item ) => {
							if (
								!! item &&
								templateSlug.endsWith( item.slug )
							) {
								term = item.name;
							}
						} );
					}
				}

				return {
					taxonomyName: templateTaxonomy,
					termName: term === undefined ? __( 'Name' ) : term,
					hasResolved: true,
				};
			}
			return {
				taxonomyName: '',
				termName: '',
				hasResolved: false,
			};
		},
		[ taxonomies, templateTaxonomy, templateSlug ]
	);

	if ( ! SUPPORTED_TYPES.includes( type ) ) {
		return (
			<div { ...blockProps }>
				<Warning>{ __( 'Provided type is not supported.' ) }</Warning>
			</div>
		);
	}

	let titleElement;
	if ( type === 'archive' ) {
		titleElement = (
			<>
				<InspectorControls>
					<PanelBody title={ __( 'Settings' ) }>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Show archive type in title' ) }
							onChange={ () =>
								setAttributes( { showPrefix: ! showPrefix } )
							}
							checked={ showPrefix }
						/>
					</PanelBody>
				</InspectorControls>
				{ ! hasResolved ? (
					<TagName { ...blockProps }>
						<Spinner />
						{ showPrefix
							? __( 'Archive type: Name' )
							: __( 'Archive title' ) }
					</TagName>
				) : (
					<TagName { ...blockProps }>
						{ showPrefix
							? sprintf(
									/* translators: 1: taxonomy name. 2: term name. */
									__( '%1$s: %2$s' ),
									taxonomyName,
									termName
							  )
							: termName }
					</TagName>
				) }
			</>
		);
	}

	if ( type === 'search' ) {
		titleElement = (
			<>
				<InspectorControls>
					<PanelBody title={ __( 'Settings' ) }>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Show search term in title' ) }
							onChange={ () =>
								setAttributes( {
									showSearchTerm: ! showSearchTerm,
								} )
							}
							checked={ showSearchTerm }
						/>
					</PanelBody>
				</InspectorControls>

				<TagName { ...blockProps }>
					{ showSearchTerm
						? __( 'Search results for: “search term”' )
						: __( 'Search results' ) }
				</TagName>
			</>
		);
	}

	return (
		<>
			<BlockControls group="block">
				<HeadingLevelDropdown
					value={ level }
					onChange={ ( newLevel ) =>
						setAttributes( { level: newLevel } )
					}
				/>
				<AlignmentControl
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
			</BlockControls>
			{ titleElement }
		</>
	);
}
