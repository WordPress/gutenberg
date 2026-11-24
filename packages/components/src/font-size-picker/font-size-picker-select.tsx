import { __ } from '@wordpress/i18n';
import { useInstanceId } from '@wordpress/compose';
import { SelectControl, useEnableWpCompatOverlaySlot } from '@wordpress/ui';
import type {
	FontSizePickerSelectProps,
	FontSizePickerSelectOption,
} from './types';
import { generateFontSizeHint } from './utils';
import { VisuallyHidden } from '../visually-hidden';
import styles from './style.module.scss';

const DEFAULT_OPTION: FontSizePickerSelectOption = {
	value: null,
	label: __( 'Default' ),
};

const FontSizePickerSelect = ( props: FontSizePickerSelectProps ) => {
	const {
		fontSizes,
		value,
		valueMode = 'literal',
		emitChangeOnReselect = false,
		onChange,
	} = props;

	useEnableWpCompatOverlaySlot();
	const descriptionId = useInstanceId(
		FontSizePickerSelect,
		'font-size-picker__description'
	);

	const options: FontSizePickerSelectOption[] = [
		DEFAULT_OPTION,
		...fontSizes.map( ( fontSize ) => ( {
			value: fontSize.slug,
			label: fontSize.name || fontSize.slug,
			size: fontSize.size,
			description: generateFontSizeHint( fontSize ),
		} ) ),
	];

	const selectedOption = ( () => {
		if ( value === undefined ) {
			return DEFAULT_OPTION;
		}

		// If valueMode is 'slug', find by slug
		if ( valueMode === 'slug' ) {
			const optionBySlug = options.find(
				( option ) => option.value === value
			);
			if ( optionBySlug ) {
				return optionBySlug;
			}
		}

		// If valueMode is 'literal', find by value (size)
		return (
			options.find( ( option ) => option.size === value ) ??
			DEFAULT_OPTION
		);
	} )();

	return (
		<>
			<SelectControl
				className="components-font-size-picker__select"
				label={ __( 'Font size' ) }
				hideLabelFromVision
				items={ options }
				value={ selectedOption }
				popupWidth="anchor"
				trigger={
					<SelectControl.Trigger aria-describedby={ descriptionId }>
						{ ( item ) => (
							<>
								{ item.label }
								{ item.description && (
									<span
										className={ styles[ 'selected-hint' ] }
										aria-hidden="true"
									>
										{ item.description }
									</span>
								) }
							</>
						) }
					</SelectControl.Trigger>
				}
				onValueChange={ ( item ) => {
					// Re-selecting Default is a no-op unless it stands in for a
					// custom value that still needs clearing. Re-selecting a
					// preset is a no-op unless the consumer opted in.
					if ( item?.value === selectedOption.value ) {
						const isNoop =
							item?.value === null
								? value === undefined
								: ! emitChangeOnReselect;
						if ( isNoop ) {
							return;
						}
					}
					const matchingFontSize = fontSizes.find(
						( fontSize ) => fontSize.slug === item?.value
					);
					onChange( matchingFontSize?.size, matchingFontSize );
				} }
			/>
			<VisuallyHidden id={ descriptionId }>
				{ selectedOption.description }
			</VisuallyHidden>
		</>
	);
};

export default FontSizePickerSelect;
