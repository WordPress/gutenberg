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
} from '@wordpress/block-editor';
import { __, _x } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import HeadingLevelDropdown from '../heading/heading-level-dropdown';

const SUPPORTED_TEMPLATES = [ 'archive', 'search', '404', 'index' ];

export default function QueryTitleEdit( {
	attributes: {
		content,
		searchTitleContent,
		nothingFoundTitleContent,
		level,
		textAlign,
	},
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
	let titleElement;

	// translators: Title for index template.
	const defaultTitle = _x(
		'Query title placeholder',
		'index template title'
	);

	// translators: Title for 404 template.
	const nothingFoundTitle = _x( 'Nothing found', '404 template title' );

	// translators: Title for archive template.
	const archiveTitle = _x(
		'Archive title placeholder',
		'archive template title'
	);

	// translators: Title for search template with dynamic content placeholders.
	const searchTitle = _x(
		'Search results for "%search%"',
		'search template title'
	);

	// Infer title content from template slug context
	// Defaults to content attribute prop
	switch ( templateSlug ) {
		case 'archive':
			titleElement = (
				<TagName { ...blockProps }>{ archiveTitle }</TagName>
			);
			break;
		case 'search':
			// Use placeholder content if new Query Title block is added
			if ( content === 'Query title' ) {
				content = searchTitle;
			}

			titleElement = (
				<div { ...blockProps }>
					<RichText
						tagName={ TagName }
						value={ content }
						placeholder={ content }
						allowedFormats={ [ 'core/bold', 'core/italic' ] }
						onChange={ ( newContent ) =>
							setAttributes( { content: newContent } )
						}
						disableLineBreaks={ true }
					/>
				</div>
			);
			break;
		case '404':
			titleElement = (
				<TagName { ...blockProps }>{ nothingFoundTitle }</TagName>
			);
			break;
		case 'index':
			titleElement = (
				<TagName { ...blockProps }>{ defaultTitle }</TagName>
			);
			break;
		default:
			titleElement = <TagName { ...blockProps }>{ content }</TagName>;
			break;
	}

	// Update content based on current template
	useEffect( () => {
		__unstableMarkNextChangeAsNotPersistent();
		setAttributes( {
			content,
			searchTitleContent: searchTitle,
			nothingFoundTitleContent: nothingFoundTitle,
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
			{ titleElement }
		</>
	);
}
