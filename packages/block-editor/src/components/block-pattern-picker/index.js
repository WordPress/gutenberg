/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, Placeholder } from '@wordpress/components';

function BlockPatternPicker( {
	icon = 'layout',
	label = __( 'Choose pattern' ),
	instructions = __( 'Select a pattern to start with.' ),
	patterns,
	onSelect,
	allowSkip,
} ) {
	const classes = classnames( 'block-editor-block-pattern-picker', {
		'has-many-patterns': patterns.length > 4,
	} );

	return (
		<Placeholder
			icon={ icon }
			label={ label }
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
			<ul className="block-editor-block-pattern-picker__patterns" role="list">
				{ patterns.map( ( pattern ) => (
					<li key={ pattern.name }>
						<Button
							isSecondary
							icon={ pattern.icon }
							iconSize={ 48 }
							onClick={ () => onSelect( pattern ) }
							className="block-editor-block-pattern-picker__pattern"
							label={ pattern.label }
						/>
					</li>
				) ) }
			</ul>
			{ /* eslint-enable jsx-a11y/no-redundant-roles */ }
			{ allowSkip && (
				<div className="block-editor-block-pattern-picker__skip">
					<Button
						isLink
						onClick={ () => onSelect() }
					>
						{ __( 'Skip' ) }
					</Button>
				</div>
			) }
		</Placeholder>
	);
}

export default BlockPatternPicker;
