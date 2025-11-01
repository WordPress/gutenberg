/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { insertObject, useAnchor } from '@wordpress/rich-text';
import { RichTextToolbarButton } from '@wordpress/block-editor';
import {
	Popover,
	TextControl,
	__experimentalVStack as VStack,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { math as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { Badge } = unlock( componentsPrivateApis );

const name = 'core/math';
const title = __( 'Math' );

function InlineUI( {
	value,
	onChange,
	activeAttributes,
	contentRef,
	latexToMathML,
} ) {
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
		let mathML;

		setLatex( newLatex );

		try {
			mathML = latexToMathML( newLatex, { displayMode: false } );
			setError( null );
		} catch ( err ) {
			setError( err.message );
			return;
		}

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
			placement="bottom-start"
			offset={ 8 }
			focusOnMount={ false }
			anchor={ popoverAnchor }
			className="block-editor-format-toolbar__math-popover"
		>
			<div style={ { minWidth: '300px', padding: '4px' } }>
				<VStack spacing={ 1 }>
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						hideLabelFromVision
						label={ __( 'LaTeX math syntax' ) }
						value={ latex }
						onChange={ handleLatexChange }
						placeholder={ __( 'e.g., x^2, \\frac{a}{b}' ) }
						autoComplete="off"
					/>
					{ error && (
						<>
							<Badge
								intent="error"
								className="wp-block-math__error"
							>
								{ error }
							</Badge>
							<style children=".wp-block-math__error .components-badge__content{white-space:normal}" />
						</>
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
	const [ latexToMathML, setLatexToMathML ] = useState();

	useEffect( () => {
		import( '@wordpress/latex-to-mathml' ).then( ( module ) => {
			setLatexToMathML( () => module.default );
		} );
	}, [] );
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
					latexToMathML={ latexToMathML }
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
