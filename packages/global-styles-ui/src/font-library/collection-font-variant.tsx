import { useId } from '@wordpress/element';
import {
	CheckboxControl as WCCheckboxControl,
	Flex,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
import { getFontFaceVariantName } from './utils';
import FontDemo from './font-demo';
import type { CollectionFontVariantProps } from './types';

function CollectionFontVariant( {
	face,
	font,
	handleToggleVariant,
	selected,
	installed,
}: CollectionFontVariantProps ) {
	const handleToggleActivation = () => {
		if ( installed ) {
			return;
		}
		if ( font?.fontFace ) {
			handleToggleVariant( font, face );
			return;
		}
		handleToggleVariant( font );
	};

	const displayName = font.name + ' ' + getFontFaceVariantName( face );
	const checkboxId = useId();

	return (
		<div className="font-library__font-card">
			<Flex justify="space-between" align="center" gap="1rem">
				<Flex justify="flex-start" align="center" gap="1rem">
					<WCCheckboxControl
						checked={ selected || installed }
						disabled={ installed }
						onChange={ handleToggleActivation }
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
				{ installed && (
					<Text className="font-library__font-card__count">
						{ __( 'Installed' ) }
					</Text>
				) }
			</Flex>
		</div>
	);
}

export default CollectionFontVariant;
