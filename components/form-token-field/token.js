/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { sprintf } from 'i18n';
import IconButton from 'components/icon-button';

function Token( {
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
} ) {
	const tokenClasses = classnames( 'components-form-token-field__token', {
		'is-error': 'error' === status,
		'is-success': 'success' === status,
		'is-validating': 'validating' === status,
		'is-borderless': isBorderless,
		'is-disabled': disabled,
	} );

	const onClick = () => onClickRemove( { value } );

	return (
		<span
			className={ tokenClasses }
			tabIndex="-1"
			onMouseEnter={ onMouseEnter }
			onMouseLeave={ onMouseLeave }
			title={ title }
		>
			<span className="components-form-token-field__token-text">
				{ displayTransform( value ) }
			</span>

			<IconButton
				className="components-form-token-field__remove-token"
				icon="dismiss"
				onClick={ ! disabled && onClick }
				label={ sprintf( messages.remove, displayTransform( value ) ) }
			/>
		</span>
	);
}

export default Token;
