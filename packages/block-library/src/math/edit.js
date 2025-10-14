/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';
import {
	TextControl,
	Notice,
	Popover,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useMemo, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import temml from 'temml';

export default function MathEdit( { attributes, setAttributes, isSelected } ) {
	const { latex } = attributes;
	const [ blockRef, setBlockRef ] = useState();

	const { mathML, error } = useMemo( () => {
		try {
			const result = temml.renderToString( latex, {
				displayMode: true,
				annotate: true,
				throwOnError: true,
			} );
			return { mathML: result, error: null };
		} catch ( err ) {
			return { mathML: latex, error: err.message };
		}
	}, [ latex ] );

	return (
		<>
			<div
				{ ...useBlockProps( {
					ref: setBlockRef,
					position: 'relative',
				} ) }
				{ ...( mathML
					? { dangerouslySetInnerHTML: { __html: mathML } }
					: { children: '\u200B' } ) }
			/>
			{ isSelected && (
				<Popover
					placement="bottom"
					offset={ 8 }
					anchor={ blockRef }
					focusOnMount="firstContentElement"
				>
					<div style={ { padding: '16px', minWidth: '300px' } }>
						<VStack spacing={ 3 }>
							<TextControl
								__nextHasNoMarginBottom
								__next40pxDefaultSize
								label={ __( 'LaTeX math syntax' ) }
								value={ latex }
								onChange={ ( newLatex ) => {
									setAttributes( { latex: newLatex } );
								} }
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
			) }
		</>
	);
}
