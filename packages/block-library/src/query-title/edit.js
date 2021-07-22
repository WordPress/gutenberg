/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import {
	AlignmentControl,
	BlockControls,
	useBlockProps,
	Warning,
	RichText,
	store as blockEditorStore,
	InspectorControls,
} from '@wordpress/block-editor';
import { TextControl, PanelBody } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import HeadingLevelDropdown from '../heading/heading-level-dropdown';

const SUPPORTED_TEMPLATES = [ 'archive', 'search', '404', 'index' ];

export default function QueryTitleEdit( {
	attributes: { content, searchTitle, nothingFoundTitle, level, textAlign },
	setAttributes,
	context: { templateSlug },
} ) {
	const TagName = `h${ level }`;
	const blockProps = useBlockProps( {
		className: classnames( 'wp-block-query-title__placeholder', {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );
	const { __unstableMarkNextChangeAsNotPersistent } = useDispatch(
		blockEditorStore
	);
	let titleContent;

	// translators: Title for index template.
	const defaultTitle = _x(
		'Query title placeholder',
		'index template title'
	);

	// translators: Title for archive template.
	const defaultArchiveTitle = _x(
		'Archive title placeholder',
		'archive template title'
	);

	// translators: Title for 404 template.
	const defaultNothingFoundTitle = _x(
		'Nothing found',
		'404 template title'
	);

	// translators: Title for search template with dynamic content placeholders.
	const defaultSearchTitle = _x(
		'Search results for "%search%"',
		'search template title'
	);

	// Infer title content from template slug context
	switch ( templateSlug ) {
		case 'archive':
			titleContent = defaultArchiveTitle;
			break;
		case 'search':
			titleContent = searchTitle;
			break;
		case '404':
			titleContent = nothingFoundTitle;
			break;
		default:
			titleContent = content;
			break;
	}

	const titleElement = <TagName { ...blockProps }>{ titleContent }</TagName>;

	// Update content based on current template
	useEffect( () => {
		__unstableMarkNextChangeAsNotPersistent();
		setAttributes( {
			content: defaultTitle,
			searchTitle: defaultSearchTitle,
			nothingFoundTitle: defaultNothingFoundTitle,
		} );
	}, [] );

	if ( ! SUPPORTED_TEMPLATES.includes( templateSlug ) ) {
		return (
			<div { ...blockProps }>
				<Warning>{ __( 'Template is not supported.' ) }</Warning>
			</div>
		);
	}

	return (
		<>
			<BlockControls group="block">
				<HeadingLevelDropdown
					selectedLevel={ level }
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
			<InspectorControls>
				<PanelBody title={ __( 'Custom Title Contents' ) }>
					<TextControl
						label={ __( 'Search Page Title' ) }
						help={ `${ __(
							'Edit the search template title. Dynamic content is available with: '
						) } %search%, %total%` }
						value={ searchTitle }
						onChange={ ( value ) =>
							setAttributes( {
								searchTitle: value,
							} )
						}
					/>
					<TextControl
						label={ __( '404 Page Title' ) }
						help={ __( 'Edit the 404 template title.' ) }
						value={ nothingFoundTitle }
						onChange={ ( value ) =>
							setAttributes( {
								nothingFoundTitle: value,
							} )
						}
					/>
				</PanelBody>
			</InspectorControls>
			{ titleElement }
		</>
	);
}
