/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';
import {
	TextareaControl,
	Popover,
	__experimentalVStack as VStack,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useMemo, useState } from '@wordpress/element';
/**
 * External dependencies
 */
import temml from 'temml';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { Badge } = unlock( componentsPrivateApis );

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
					placement="bottom-start"
					offset={ 8 }
					anchor={ blockRef }
					focusOnMount="firstContentElement"
				>
					<div style={ { padding: '4px', minWidth: '300px' } }>
						<VStack spacing={ 1 }>
							<TextareaControl
								__nextHasNoMarginBottom
								__next40pxDefaultSize
								label={ __( 'LaTeX math syntax' ) }
								hideLabelFromVision
								value={ latex }
								onChange={ ( newLatex ) => {
									setAttributes( { latex: newLatex } );
								} }
								placeholder={ __( 'e.g., x^2, \\frac{a}{b}' ) }
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
			) }
		</>
	);
}
