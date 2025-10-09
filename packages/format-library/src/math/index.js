/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { insertObject, useAnchor } from '@wordpress/rich-text';
import { RichTextToolbarButton } from '@wordpress/block-editor';
import {
	Popover,
	TextControl,
	Notice,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { math as icon } from '@wordpress/icons';

/**
 * External dependencies
 */
import temml from 'temml';

const name = 'core/math';
const title = __( 'Math' );

function InlineUI( { value, onChange, activeAttributes, contentRef } ) {
	const [ latex, setLatex ] = useState(
		activeAttributes?.[ 'data-latex' ] || ''
	);
	const [ error, setError ] = useState( null );

	const popoverAnchor = useAnchor( {
		editableContentElement: contentRef.current,
		settings: math,
	} );

	// Update the math object in real-time as the user types
	const handleLatexChange = ( newLatex ) => {
		let result;

		setLatex( newLatex );

		try {
			result = temml.renderToString( newLatex, {
				displayMode: false,
				annotate: true,
				throwOnError: true,
			} );
			setError( null );
		} catch ( err ) {
			setError( err.message );
			return;
		}

		const doc = document.implementation.createHTMLDocument( '' );
		doc.body.innerHTML = result;
		const mathML = doc.body.querySelector( 'math' ).innerHTML;

		const newReplacements = value.replacements.slice();
		newReplacements[ value.start ] = {
			type: name,
			attributes: {
				'data-latex': newLatex,
			},
			innerHTML: mathML,
		};

		onChange( {
			...value,
			replacements: newReplacements,
		} );
	};

	return (
		<Popover
			placement="bottom"
			offset={ 8 }
			focusOnMount="firstContentElement"
			anchor={ popoverAnchor }
			className="block-editor-format-toolbar__math-popover"
		>
			<div style={ { minWidth: '300px', padding: '16px' } }>
				<VStack spacing={ 3 }>
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'LaTeX math syntax' ) }
						value={ latex }
						onChange={ handleLatexChange }
						placeholder={ __( 'e.g., x^2, \\frac{a}{b}' ) }
					/>
					{ error && (
						<Notice status="error" isDismissible={ false }>
							{ error }
						</Notice>
					) }
				</VStack>
			</div>
		</Popover>
	);
}

function Edit( {
	value,
	onChange,
	onFocus,
	isObjectActive,
	activeObjectAttributes,
	contentRef,
} ) {
	return (
		<>
			<RichTextToolbarButton
				icon={ icon }
				title={ title }
				onClick={ () => {
					const newValue = insertObject( value, {
						type: name,
						attributes: {
							'data-latex': '',
						},
						innerHTML: '',
					} );
					newValue.start = newValue.end - 1;
					onChange( newValue );
					onFocus();
				} }
				isActive={ isObjectActive }
			/>
			{ isObjectActive && (
				<InlineUI
					value={ value }
					onChange={ onChange }
					activeAttributes={ activeObjectAttributes }
					contentRef={ contentRef }
				/>
			) }
		</>
	);
}

export const math = {
	name,
	title,
	tagName: 'math',
	className: null,
	attributes: {
		'data-latex': 'data-latex',
	},
	contentEditable: false,
	edit: Edit,
};
