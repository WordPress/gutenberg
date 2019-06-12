/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, IconButton, Placeholder } from '@wordpress/components';

function InnerBlocksTemplatePicker( {
	options,
	onSelect,
	allowSkip,
} ) {
	const classes = classnames( 'block-editor-inner-blocks__template-picker', {
		'has-many-options': options.length > 4,
	} );

	const instructions = allowSkip ?
		__( 'Select a layout to start with, or make one yourself.' ) :
		__( 'Select a layout to start with.' );

	return (
		<Placeholder
			icon="layout"
			label={ __( 'Choose Layout' ) }
			instructions={ instructions }
			className={ classes }
		>
			<div className="block-editor-inner-blocks__template-picker-options">
				{ options.map( ( templateOption, index ) => (
					<IconButton
						key={ index }
						isLarge
						icon={ templateOption.icon }
						onClick={ () => onSelect( templateOption.template ) }
						className="block-editor-inner-blocks__template-picker-option"
						label={ templateOption.title }
					/>
				) ) }
			</div>
			{ allowSkip && (
				<div className="block-editor-inner-blocks__template-picker-skip">
					<Button
						isLink
						onClick={ () => onSelect( undefined ) }
					>
						{ __( 'Skip' ) }
					</Button>
				</div>
			) }
		</Placeholder>
	);
}

export default InnerBlocksTemplatePicker;
