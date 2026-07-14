/**
 * WordPress dependencies
 */
import { useEffect, useId, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { mapMarker } from '@wordpress/icons';
// The dashboard is still experimental.
/* eslint-disable @wordpress/use-recommended-components */
import {
	Autocomplete,
	Button,
	IconButton,
	InputControl,
	InputLayout,
	Stack,
} from '@wordpress/ui';
/* eslint-enable @wordpress/use-recommended-components */

/**
 * Internal dependencies
 */
import styles from './location-picker.module.css';

type LocationOption = {
	id: string;
	value: string;
};

const SEARCH_DEBOUNCE_MS = 500;

type LocationPickerProps = {
	/**
	 * The initial input value.
	 */
	seedInput?: string;
	/**
	 * Whether to hide the label from vision.
	 */
	hideLabelFromVision?: boolean;

	/**
	 * Show the input's help text. Defaults to true.
	 */
	showDescription?: boolean;

	/**
	 * Controls Select button visibility.
	 */
	selectButton?: boolean;

	/**
	 * Called when the user submits via the Select button.
	 */
	onSubmit?: ( location: string ) => void;

	/**
	 * Called when the staged location changes through a deliberate action: an
	 * autocomplete selection, geolocation, or clearing the field. Never fires
	 * for intermediate typing, so the saved value is always a real choice. Used
	 * when `selectButton` is false.
	 */
	onChange?: ( location: string ) => void;
};

export function LocationPicker( {
	onSubmit = () => {},
	seedInput = '',
	hideLabelFromVision = true,
	showDescription = true,
	selectButton = true,
	onChange,
}: LocationPickerProps ) {
	const locationInputId = useId();
	const [ locationInput, setLocationInput ] = useState( seedInput );
	const [ locationOptions, setLocationOptions ] = useState<
		LocationOption[]
	>( [] );
	const [ isLocatingCity, setIsLocatingCity ] = useState( false );

	useEffect( () => {
		if ( ! selectButton || seedInput ) {
			setLocationInput( seedInput );
		}
	}, [ selectButton, seedInput ] );

	const fillCityFromGeolocation = async () => {
		if ( ! navigator.geolocation || isLocatingCity ) {
			return;
		}

		setIsLocatingCity( true );

		try {
			const position = await new Promise< GeolocationPosition >(
				( resolve, reject ) => {
					navigator.geolocation.getCurrentPosition( resolve, reject, {
						enableHighAccuracy: false,
						timeout: 10000,
					} );
				}
			);

			const { latitude, longitude } = position.coords;
			const response = await fetch(
				`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${ latitude }&lon=${ longitude }`
			);
			const data = ( await response.json() ) as {
				address?: {
					city?: string;
					town?: string;
					village?: string;
					municipality?: string;
				};
			};

			const city =
				data.address?.city ??
				data.address?.town ??
				data.address?.village ??
				data.address?.municipality;

			if ( city ) {
				setLocationInput( city );
				// Geolocation is a confirmed choice, so stage it.
				if ( ! selectButton ) {
					onChange?.( city );
				}
			}
		} catch {
			// No-op: keep manual location entry as fallback.
		} finally {
			setIsLocatingCity( false );
		}
	};

	useEffect( () => {
		const query = locationInput.trim();

		if ( query.length < 2 ) {
			setLocationOptions( [] );
			return;
		}

		const controller = new AbortController();
		const timeoutId = setTimeout( async () => {
			try {
				const params = new URLSearchParams( {
					q: query,
					featureType: 'city',
					format: 'jsonv2',
					addressdetails: '1',
					limit: '8',
				} );
				const response = await fetch(
					`https://nominatim.openstreetmap.org/search?${ params }`,
					{ signal: controller.signal }
				);
				const data = ( await response.json() ) as Array< {
					place_id: number;
					address?: {
						city?: string;
						town?: string;
						village?: string;
						municipality?: string;
						country?: string;
					};
				} >;

				const seen = new Set< string >();
				const nextOptions = data
					.map( ( place ) => {
						const city =
							place.address?.city ??
							place.address?.town ??
							place.address?.village ??
							place.address?.municipality;
						const country = place.address?.country;

						if ( ! city ) {
							return null;
						}

						const label = country
							? `${ city }, ${ country }`
							: city;
						if ( seen.has( label.toLowerCase() ) ) {
							return null;
						}

						seen.add( label.toLowerCase() );
						return {
							id: String( place.place_id ),
							value: label,
						};
					} )
					.filter( Boolean ) as LocationOption[];

				setLocationOptions( nextOptions );
			} catch ( error: unknown ) {
				if ( error instanceof Error && error.name === 'AbortError' ) {
					return;
				}
				setLocationOptions( [] );
			}
		}, SEARCH_DEBOUNCE_MS );

		return () => {
			clearTimeout( timeoutId );
			controller.abort();
		};
	}, [ locationInput ] );

	return (
		<form
			onSubmit={ ( e ) => {
				e.preventDefault();
				if ( selectButton ) {
					onSubmit( locationInput );
				}
			} }
		>
			<Stack direction="row" align="start" wrap="wrap" gap="sm">
				<Autocomplete.Root
					items={ locationOptions }
					value={ locationInput }
					onValueChange={ ( value, eventDetails ) => {
						setLocationInput( value );
						// Stage only deliberate changes: pressing an item or
						// clearing the field, never intermediate typing, so the
						// saved value is always a real choice.
						const isDeliberate =
							eventDetails.reason === 'item-press' ||
							eventDetails.reason === 'clear-press';
						if ( ! selectButton && isDeliberate ) {
							onChange?.( value );
						}
					} }
				>
					<Autocomplete.Input
						id={ locationInputId }
						className={ styles[ 'location-input' ] }
						render={
							<InputControl
								autoComplete="off"
								label={ __( 'City' ) }
								hideLabelFromVision={ hideLabelFromVision }
								size="compact"
								description={
									showDescription
										? __(
												'Select a city to view upcoming events.'
										  )
										: undefined
								}
								onValueChange={ () => {} }
								suffix={
									<InputLayout.Slot padding="minimal">
										<Autocomplete.Clear />
										<IconButton
											icon={ mapMarker }
											label={ __(
												'Use current location'
											) }
											onClick={ fillCityFromGeolocation }
											disabled={ isLocatingCity }
											size="small"
											variant="minimal"
										/>
									</InputLayout.Slot>
								}
							/>
						}
						placeholder={ __( 'Select city…' ) }
					/>
					{ locationOptions.length > 0 && (
						<Autocomplete.Popup>
							<Autocomplete.List>
								<Autocomplete.ListBody>
									<Autocomplete.Collection>
										{ ( item: {
											id: string;
											value: string;
										} ) => (
											<Autocomplete.Item
												key={ item.id }
												value={ item }
											>
												{ item.value }
											</Autocomplete.Item>
										) }
									</Autocomplete.Collection>
								</Autocomplete.ListBody>
							</Autocomplete.List>
						</Autocomplete.Popup>
					) }
				</Autocomplete.Root>
				{ selectButton && (
					<Button
						variant="outline"
						size="compact"
						type="submit"
						disabled={ ! locationInput.trim() }
					>
						{ __( 'Select' ) }
					</Button>
				) }
			</Stack>
		</form>
	);
}
