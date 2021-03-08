/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { VisuallyHidden, Button } from '@wordpress/components';
import { Icon, search, closeSmall } from '@wordpress/icons';
import { useRef } from '@wordpress/element';

function InserterSearchForm( {
	className,
	onChange,
	value,
	label,
	placeholder,
} ) {
	const instanceId = useInstanceId( InserterSearchForm );
	const searchInput = useRef();

	return (
		<div
			className={ classnames(
				'block-editor-inserter__search',
				className
			) }
		>
			<VisuallyHidden
				as="label"
				htmlFor={ `block-editor-inserter__search-${ instanceId }` }
			>
				{ label || placeholder }
			</VisuallyHidden>
			<input
				ref={ searchInput }
				className="block-editor-inserter__search-input"
				id={ `block-editor-inserter__search-${ instanceId }` }
				type="search"
				placeholder={ placeholder }
				onChange={ ( event ) => onChange( event.target.value ) }
				autoComplete="off"
				value={ value || '' }
			/>
			<div className="block-editor-inserter__search-icon">
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

export default InserterSearchForm;
