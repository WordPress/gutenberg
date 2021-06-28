/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { Icon, search, closeSmall } from '@wordpress/icons';
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Button } from '../';
import BaseControl from '../base-control';

function SearchControl( {
	className,
	onChange,
	value,
	label,
	placeholder = __( 'Search' ),
	hideLabelFromVision = true,
	help,
} ) {
	const instanceId = useInstanceId( SearchControl );
	const searchInput = useRef();
	const id = `components-search-control-${ instanceId }`;

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
					ref={ searchInput }
					className="components-search-control__input"
					id={ id }
					type="search"
					placeholder={ placeholder }
					onChange={ ( event ) => onChange( event.target.value ) }
					autoComplete="off"
					value={ value || '' }
				/>
				<div className="components-search-control__icon">
					{ !! value && (
						<Button
							icon={ closeSmall }
							label={ __( 'Reset search' ) }
							onClick={ () => {
								onChange( '' );
								searchInput.current.focus();
							} }
						/>
					) }
					{ ! value && <Icon icon={ search } /> }
				</div>
			</div>
		</BaseControl>
	);
}

export default SearchControl;
