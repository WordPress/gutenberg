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
import { VisuallyHidden, Button } from '../';

function SearchControl( {
	className,
	onChange,
	value,
	label,
	placeholder = __( 'Search' ),
} ) {
	const instanceId = useInstanceId( SearchControl );
	const searchInput = useRef();

	return (
		<div className={ classnames( 'components-search-control', className ) }>
			<VisuallyHidden
				as="label"
				htmlFor={ `components-search-control-${ instanceId }` }
			>
				{ label || placeholder }
			</VisuallyHidden>
			<input
				ref={ searchInput }
				className="components-search-control__input"
				id={ `components-search-control-${ instanceId }` }
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
	);
}

export default SearchControl;
