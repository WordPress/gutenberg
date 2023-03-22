/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Button from '../button';
import { VisuallyHidden } from '../visually-hidden';
import type { TokenProps } from './types';

const noop = () => {};

export default function Token( {
	value,
	status,
	title,
	displayTransform,
	isBorderless = false,
	disabled = false,
	onClickRemove = noop,
	onMouseEnter,
	onMouseLeave,
	messages,
	termPosition,
	termsCount,
}: TokenProps ) {
	const instanceId = useInstanceId( Token );
	const tokenClasses = classnames( 'components-form-token-field__token', {
		'is-error': 'error' === status,
		'is-success': 'success' === status,
		'is-validating': 'validating' === status,
		'is-borderless': isBorderless,
		'is-disabled': disabled,
	} );

	const onClick = () => onClickRemove( { value } );

	const transformedValue = displayTransform( value );
	const termPositionAndCount = sprintf(
		/* translators: 1: term name, 2: term position in a set of terms, 3: total term set count. */
		__( '%1$s (%2$s of %3$s)' ),
		transformedValue,
		termPosition,
		termsCount
	);

	return (
		<span
			className={ tokenClasses }
			onMouseEnter={ onMouseEnter }
			onMouseLeave={ onMouseLeave }
			title={ title }
		>
			<span
				className="components-form-token-field__token-text"
				id={ `components-form-token-field__token-text-${ instanceId }` }
			>
				<VisuallyHidden as="span">
					{ termPositionAndCount }
				</VisuallyHidden>
				<span aria-hidden="true">{ transformedValue }</span>
			</span>

			<Button
				className="components-form-token-field__remove-token"
				icon={ closeSmall }
				onClick={ ! disabled ? onClick : undefined }
				label={ messages.remove }
				aria-describedby={ `components-form-token-field__token-text-${ instanceId }` }
			/>
		</span>
	);
}
