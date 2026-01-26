/**
 * WordPress dependencies
 */
import { useCallback, useMemo, useState } from '@wordpress/element';
import { Icon, starFilled, starEmpty } from '@wordpress/icons';
import { BaseControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import DataForm from '../index';
import useFormValidity from '../../hooks/use-form-validity';
import type {
	DataFormControlProps,
	Field,
	Form,
	RegularLayout,
	FieldValidity,
} from '../../types';

type SampleProduct = {
	ratingDefault?: number;
	ratingWithConfig?: number;
};

function StarRatingControl< Item >( {
	data,
	field,
	onChange,
	config,
	hideLabelFromVision,
	validity,
}: DataFormControlProps< Item > & { validity?: FieldValidity } ) {
	const value = field.getValue( { item: data } ) ?? 0;
	const starCount = ( config?.starCount as number ) ?? 5;
	const stars = Array.from( { length: starCount }, ( _, i ) => i + 1 );

	const getValidationError = () => {
		if ( validity?.required?.type === 'invalid' ) {
			return validity.required.message ?? 'This field is required.';
		}
		if ( validity?.custom?.type === 'invalid' ) {
			return validity.custom.message;
		}
		return undefined;
	};
	const validationError = getValidationError();
	const helpText = validationError ?? field.description;

	return (
		<BaseControl
			id={ field.id }
			label={ field.label }
			hideLabelFromVision={ hideLabelFromVision }
			help={ helpText }
			__nextHasNoMarginBottom
		>
			<div
				style={ {
					display: 'flex',
					gap: '4px',
					...( validationError && {
						outline: '1px solid #cc1818',
						outlineOffset: '2px',
						borderRadius: '2px',
					} ),
				} }
			>
				{ stars.map( ( star ) => (
					<button
						key={ star }
						type="button"
						onClick={ () =>
							onChange(
								field.setValue( {
									item: data,
									value: star === value ? undefined : star,
								} )
							)
						}
						style={ {
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							padding: 0,
						} }
						aria-label={ `Rate ${ star } stars` }
					>
						<Icon
							icon={ star <= value ? starFilled : starEmpty }
							size={ 24 }
							style={ {
								fill: star <= value ? '#f0b849' : '#ccc',
							} }
						/>
					</button>
				) ) }
			</div>
		</BaseControl>
	);
}

const RegisterControlsComponent = ( {
	labelPosition,
	required,
	custom,
}: {
	labelPosition: 'default' | 'top' | 'side' | 'none';
	required: boolean;
	custom: boolean;
} ) => {
	const [ product, setProduct ] = useState< SampleProduct >( {
		ratingDefault: 1,
		ratingWithConfig: 2,
	} );

	const customRatingRule = useCallback( ( item: SampleProduct ) => {
		if ( item.ratingDefault !== undefined && item.ratingDefault <= 2 ) {
			return 'Rating must be higher than 2.';
		}
		return null;
	}, [] );

	const customRatingWithConfigRule = useCallback( ( item: SampleProduct ) => {
		if (
			item.ratingWithConfig !== undefined &&
			item.ratingWithConfig <= 2
		) {
			return 'Rating must be higher than 2.';
		}
		return null;
	}, [] );

	const fields: Field< SampleProduct >[] = useMemo(
		() => [
			{
				id: 'ratingDefault',
				label: 'Rating',
				type: 'integer',
				Edit: 'starRating', // Reference custom control by name
				isValid: {
					required,
					custom: custom ? customRatingRule : undefined,
				},
			},
			{
				id: 'ratingWithConfig',
				label: 'Rating (3 stars)',
				type: 'integer',
				Edit: {
					// Reference custom control by config
					control: 'starRating',
					starCount: 3,
				},
				isValid: {
					required,
					custom: custom ? customRatingWithConfigRule : undefined,
				},
			},
		],
		[ required, custom, customRatingRule, customRatingWithConfigRule ]
	);

	const form: Form = useMemo( () => {
		const layout: RegularLayout = {
			type: 'regular',
		};
		if ( labelPosition !== 'default' ) {
			layout.labelPosition = labelPosition;
		}
		return {
			layout,
			fields: [ 'ratingDefault', 'ratingWithConfig' ],
		};
	}, [ labelPosition ] );

	const { validity } = useFormValidity( product, fields, form );
	return (
		<DataForm< SampleProduct >
			data={ product }
			fields={ fields }
			form={ form }
			onChange={ ( edits ) =>
				setProduct( ( prev ) => ( { ...prev, ...edits } ) )
			}
			validity={ validity }
			settings={ {
				controls: {
					starRating: StarRatingControl,
				},
			} }
		/>
	);
};

export default RegisterControlsComponent;
