import clsx from 'clsx';
import { error, published } from '@wordpress/icons';
import { Icon as WCIcon, Spinner } from '@wordpress/components';

export function ValidityIndicator( {
	id,
	type,
	message,
}: {
	id?: string;
	type: 'validating' | 'valid' | 'invalid';
	message?: string;
} ) {
	const ICON = {
		valid: published,
		invalid: error,
	};
	return (
		<p
			id={ id }
			className={ clsx(
				'dataviews-validated-control__indicator',
				`is-${ type }`
			) }
		>
			{ type === 'validating' ? (
				<Spinner className="dataviews-validated-control__indicator-spinner" />
			) : (
				<WCIcon
					className="dataviews-validated-control__indicator-icon"
					icon={ ICON[ type ] }
					size={ 16 }
					fill="currentColor"
				/>
			) }
			{ message }
		</p>
	);
}
