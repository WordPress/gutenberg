/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
// import { useSelect, useDispatch } from '@wordpress/data';
import {
	AlignmentControl,
	BlockControls,
	Warning,
	useBlockProps,
} from '@wordpress/block-editor';
import { __, _x } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import HeadingLevelDropdown from '../heading/heading-level-dropdown';

const SUPPORTED_TEMPLATES = [ 'archive', 'search', '404' ];

export default function QueryTitleEdit( {
	attributes: { content, level, textAlign },
	setAttributes,
	context: { templateSlug },
} ) {
	const TagName = `h${ level }`;
	const blockProps = useBlockProps( {
		className: classnames( 'wp-block-query-title__placeholder', {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	// Infer title content from template slug context
	// Defaults to content attribute prop
	switch ( templateSlug ) {
		case 'archive':
			// translators: Title for archive template.
			content = _x( 'Archive title', 'archive template title' );
			break;
		case 'search':
			// translators: Title for search template with dynamic content placeholders.
			content = _x(
				'Search results for "%search%"',
				'search template title'
			);
			break;
		case '404':
			// translators: Title for 404 template.
			content = _x( 'Nothing found', '404 template title' );
			break;
	}

	// Update content based on current template
	useEffect( () => {
		setAttributes( {
			content,
		} );
	}, [] );

	const titleElement = <TagName { ...blockProps }>{ content }</TagName>;

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
