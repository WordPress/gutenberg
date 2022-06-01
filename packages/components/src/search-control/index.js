/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useInstanceId, useMergeRefs } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { Icon, search, closeSmall } from '@wordpress/icons';
import { forwardRef, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Button } from '../';
import BaseControl from '../base-control';

function SearchControl(
	{
		className,
		onChange,
		onKeyDown,
		value,
		label,
		placeholder = __( 'Search' ),
		hideLabelFromVision = true,
		help,
		onClose,
	},
	forwardedRef
) {
	const searchRef = useRef();
	const instanceId = useInstanceId( SearchControl );
	const id = `components-search-control-${ instanceId }`;

	const renderRightButton = () => {
		if ( onClose ) {
			return (
				<Button
					icon={ closeSmall }
					label={ __( 'Close search' ) }
					onClick={ onClose }
				/>
			);
		}

		if ( !! value ) {
			return (
				<Button
					icon={ closeSmall }
					label={ __( 'Reset search' ) }
					onClick={ () => {
						onChange( '' );
						searchRef.current.focus();
					} }
				/>
			);
		}

		return <Icon icon={ search } />;
	};

	return (
		<BaseControl
			label={ label }
			id={ id }
			hideLabelFromVision={ hideLabelFromVision }
			help={ help }
			className={ classnames( className, 'components-search-control' ) }
		>
			<div className="components-search-control__input-wrapper">
				<input
					ref={ useMergeRefs( [ searchRef, forwardedRef ] ) }
					className="components-search-control__input"
					id={ id }
					type="search"
					placeholder={ placeholder }
					onChange={ ( event ) => onChange( event.target.value ) }
					onKeyDown={ onKeyDown }
					autoComplete="off"
					value={ value || '' }
				/>
				<div className="components-search-control__icon">
					{ renderRightButton() }
				</div>
			</div>
		</BaseControl>
	);
}

export default forwardRef( SearchControl );
