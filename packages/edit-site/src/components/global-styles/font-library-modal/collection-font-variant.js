/**
 * WordPress dependencies
 */
import { useId } from '@wordpress/element';
import { CheckboxControl, Flex } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getFontFaceVariantName } from './utils';
import FontDemo from './font-demo';

function CollectionFontVariant( {
	face,
	font,
	handleToggleVariant,
	selected,
} ) {
	const handleToggleActivation = () => {
		if ( font?.fontFace ) {
			handleToggleVariant( font, face );
			return;
		}
		handleToggleVariant( font );
	};

	const displayName = font.name + ' ' + getFontFaceVariantName( face );
	const checkboxId = useId();

	return (
		<div className="font-library-modal__font-card">
			<Flex justify="flex-start" align="center" gap="1rem">
				<CheckboxControl
					checked={ selected }
					onChange={ handleToggleActivation }
					__nextHasNoMarginBottom
					id={ checkboxId }
				/>
				<label htmlFor={ checkboxId }>
					<FontDemo
						font={ face }
						text={ displayName }
						onClick={ handleToggleActivation }
					/>
				</label>
			</Flex>
		</div>
	);
}

export default CollectionFontVariant;
