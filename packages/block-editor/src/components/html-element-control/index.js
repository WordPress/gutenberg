/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	SelectControl,
	Notice,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { htmlElementMessages } from './messages';

/**
 * Renders a SelectControl for choosing HTML elements with validation
 * to prevent duplicate <main> elements.
 *
 * @param {Object}   props          Component props.
 * @param {string}   props.tagName  The current HTML tag name.
 * @param {Function} props.onChange Function to call when the tag is changed.
 * @param {string}   props.clientId Optional. The client ID of the block. Used to check for existing <main> elements.
 * @param {Array}    props.options  SelectControl options (optional).
 *
 * @return {Component} The HTML element select control with validation.
 */
export default function HTMLElementControl( {
	tagName,
	onChange,
	clientId,
	options = [
		{ label: __( 'Default (<div>)' ), value: 'div' },
		{ label: '<header>', value: 'header' },
		{ label: '<main>', value: 'main' },
		{ label: '<section>', value: 'section' },
		{ label: '<article>', value: 'article' },
		{ label: '<aside>', value: 'aside' },
		{ label: '<footer>', value: 'footer' },
	],
} ) {
	const checkForMainTag =
		!! clientId && options.some( ( option ) => option.value === 'main' );

	const hasMainElementElsewhere = useSelect(
		( select ) => {
			if ( ! checkForMainTag ) {
				return false;
			}

			const { getClientIdsWithDescendants, getBlockAttributes } =
				select( blockEditorStore );

			return getClientIdsWithDescendants().some( ( id ) => {
				// Skip the current block.
				if ( id === clientId ) {
					return false;
				}

				return getBlockAttributes( id )?.tagName === 'main';
			} );
		},
		[ clientId, checkForMainTag ]
	);

	// Create a modified options array that disables the main option if needed.
	const modifiedOptions = options.map( ( option ) => {
		if (
			option.value === 'main' &&
			hasMainElementElsewhere &&
			tagName !== 'main'
		) {
			return {
				...option,
				disabled: true,
				label: sprintf(
					/* translators: %s: HTML element name */
					__( '%s (Already in use)' ),
					option.label
				),
			};
		}
		return option;
	} );

	return (
		<VStack spacing={ 2 } className="block-editor-html-element-control">
			<SelectControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				label={ __( 'HTML element' ) }
				options={ modifiedOptions }
				value={ tagName }
				onChange={ onChange }
				help={ htmlElementMessages[ tagName ] }
			/>

			{ tagName === 'main' && hasMainElementElsewhere && (
				<Notice status="warning" isDismissible={ false }>
					{ __(
						'Multiple <main> elements detected. The duplicate may be in your content or template. This is not valid HTML and may cause accessibility issues. Please change this HTML element.'
					) }
				</Notice>
			) }
		</VStack>
	);
}
