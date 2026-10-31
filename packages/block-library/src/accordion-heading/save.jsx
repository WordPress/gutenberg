import clsx from 'clsx';
import {
	useBlockProps,
	__experimentalGetSpacingClassesAndStyles as getSpacingClassesAndStyles,
	RichText,
	getTypographyClassesAndStyles,
} from '@wordpress/block-editor';

/*
 * Renders the toggle icon slot for one icon position.
 *
 * When the block stores a state-aware icon reference, the slot carries one
 * span per state (`rest`, plus named alternates such as `expanded`). The
 * front end fills these spans from the Icon Registry, and the control's own
 * state (the `is-open` class) decides which span is visible. Without a
 * reference, the legacy `+` glyph renders, which the front end rotates.
 */
function ToggleIcon( { isStateful, hasExpandedIcon } ) {
	if ( ! isStateful ) {
		return (
			<span
				className="wp-block-accordion-heading__toggle-icon"
				aria-hidden="true"
			>
				+
			</span>
		);
	}

	return (
		<span
			className="wp-block-accordion-heading__toggle-icon is-stateful"
			aria-hidden="true"
		>
			<span data-icon-state="rest" />
			{ hasExpandedIcon && <span data-icon-state="expanded" /> }
		</span>
	);
}

export default function save( { attributes } ) {
	const { level, title, iconPosition, showIcon, icon, iconStates } =
		attributes;
	const TagName = 'h' + ( level || 3 );
	const typographyProps = getTypographyClassesAndStyles( attributes );

	// Icon references are namespaced names resolved through the Icon
	// Registry; anything else falls back to the legacy `+` glyph.
	const isStateful = typeof icon === 'string' && icon !== '';
	const hasExpandedIcon =
		typeof iconStates?.expanded === 'string' && iconStates.expanded !== '';

	const blockProps = useBlockProps.save( {
		className: clsx( {
			'has-icon': showIcon,
			'has-icon-left': showIcon && iconPosition === 'left',
			'has-icon-right': showIcon && iconPosition === 'right',
		} ),
	} );
	const spacingProps = getSpacingClassesAndStyles( attributes );

	return (
		<TagName { ...blockProps }>
			<button
				type="button"
				className="wp-block-accordion-heading__toggle"
				style={ spacingProps.style }
			>
				{ showIcon && iconPosition === 'left' && (
					<ToggleIcon
						isStateful={ isStateful }
						hasExpandedIcon={ hasExpandedIcon }
					/>
				) }
				<RichText.Content
					className="wp-block-accordion-heading__toggle-title"
					tagName="span"
					value={ title }
					style={ {
						letterSpacing: typographyProps.style.letterSpacing,
						textDecoration: typographyProps.style.textDecoration,
					} }
				/>
				{ showIcon && iconPosition === 'right' && (
					<ToggleIcon
						isStateful={ isStateful }
						hasExpandedIcon={ hasExpandedIcon }
					/>
				) }
			</button>
		</TagName>
	);
}
