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
			{
				/*
				* Disable reason: The `list` ARIA role is redundant but
				* Safari+VoiceOver won't announce the list otherwise.
				*/
				/* eslint-disable jsx-a11y/no-redundant-roles */
			}
			<ul className="block-editor-inner-blocks__template-picker-options" role="list">
				{ options.map( ( templateOption, index ) => (
					<li key={ index }>
						<IconButton
							isLarge
							icon={ templateOption.icon }
							onClick={ () => onSelect( templateOption.template ) }
							className="block-editor-inner-blocks__template-picker-option"
							label={ templateOption.title }
						/>
					</li>
				) ) }
			</ul>
			{ /* eslint-enable jsx-a11y/no-redundant-roles */ }
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
