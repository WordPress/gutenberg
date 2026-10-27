import { Autocomplete, Field, Input, InputLayout } from '@wordpress/ui';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { PIXEL_AMOUNT_REGEXP } from './utils';
import type { SizeSuggestion, SizeSuggestionsControlProps } from './types';

const SIZE_SUGGESTION_PERCENTAGES = [ 25, 50, 75, 100 ];

/**
 * Field that edits a width or height in pixels, and suggests sizes that are
 * fractions of the natural size of the content, e.g. half the width of a
 * high density image.
 *
 * @param {SizeSuggestionsControlProps} props The component props.
 *
 * @return The size field.
 */
export default function SizeSuggestionsControl( {
	label,
	value,
	onChange,
	naturalSize,
}: SizeSuggestionsControlProps ) {
	// Holds the text while it's being typed, so that text which isn't a size
	// yet, e.g. '12.', can be typed without being saved.
	const [ draft, setDraft ] = useState< string | null >( null );

	const suggestions: SizeSuggestion[] = SIZE_SUGGESTION_PERCENTAGES.map(
		( percentage ) => ( {
			percentage,
			size: String( Math.round( ( naturalSize * percentage ) / 100 ) ),
		} )
	);

	return (
		<Autocomplete.Root
			items={ suggestions }
			// The suggestions are shortcuts rather than search results, so all
			// of them stay listed whatever is typed.
			mode="none"
			openOnInputClick
			value={ draft ?? value }
			itemToStringValue={ ( suggestion: SizeSuggestion ) =>
				suggestion.size
			}
			onValueChange={ ( nextValue ) => {
				setDraft( nextValue );
				if ( ! nextValue ) {
					onChange( undefined );
				} else if ( PIXEL_AMOUNT_REGEXP.test( nextValue ) ) {
					onChange( `${ nextValue }px` );
				}
			} }
		>
			<Field.Root>
				<Field.Label>{ label }</Field.Label>
				<Autocomplete.Input
					placeholder={ __( 'Auto' ) }
					inputMode="decimal"
					// Text that isn't a size is dropped when leaving the field.
					onBlur={ () => setDraft( null ) }
					render={
						<Input
							onValueChange={ () => {} }
							suffix={ <InputLayout.Slot>px</InputLayout.Slot> }
						/>
					}
				/>
			</Field.Root>
			<Autocomplete.Popup>
				<Autocomplete.List>
					<Autocomplete.ListBody>
						<Autocomplete.Collection>
							{ ( suggestion: SizeSuggestion ) => (
								<Autocomplete.Item
									key={ suggestion.percentage }
									value={ suggestion }
								>
									<Autocomplete.ItemLabel>
										{ sprintf(
											/* translators: %d: Percentage value. */
											__( '%d%%' ),
											suggestion.percentage
										) }
									</Autocomplete.ItemLabel>
									<Autocomplete.ItemDescription>
										{ `${ suggestion.size }px` }
									</Autocomplete.ItemDescription>
								</Autocomplete.Item>
							) }
						</Autocomplete.Collection>
					</Autocomplete.ListBody>
				</Autocomplete.List>
			</Autocomplete.Popup>
		</Autocomplete.Root>
	);
}
