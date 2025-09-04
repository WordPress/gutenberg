/**
 * WordPress dependencies
 */
import { Button, VisuallyHidden } from '@wordpress/components';
import { __, isRTL } from '@wordpress/i18n';
import { chevronLeftSmall, chevronRightSmall } from '@wordpress/icons';
import { useInstanceId, useFocusOnMount } from '@wordpress/compose';
import { LinkControl } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { LinkUIPageCreator } from './page-creator';

/**
 * Shared BackButton component for consistent navigation across LinkUI sub-components.
 *
 * @param {Object}   props           Component props.
 * @param {string}   props.className CSS class name for the button.
 * @param {Function} props.onBack    Callback when user wants to go back.
 */
function BackButton( { className, onBack } ) {
	return (
		<Button
			className={ className }
			icon={ isRTL() ? chevronRightSmall : chevronLeftSmall }
			onClick={ ( e ) => {
				e.preventDefault();
				onBack();
			} }
			size="small"
		>
			{ __( 'Back' ) }
		</Button>
	);
}

/**
 * Shared DialogWrapper component for consistent dialog structure across LinkUI sub-components.
 *
 * @param {Object}   props             Component props.
 * @param {string}   props.className   CSS class name for the dialog container.
 * @param {string}   props.title       Dialog title for accessibility.
 * @param {string}   props.description Dialog description for accessibility.
 * @param {Function} props.onBack      Callback when user wants to go back.
 * @param {Object}   props.children    Child components to render inside the dialog.
 */
function DialogWrapper( { className, title, description, onBack, children } ) {
	// Derive component and componentName from className
	let component = LinkControl;
	if ( className === 'link-ui-block-inserter' ) {
		component = LinkControl;
	} else if ( className === 'link-ui-page-creator' ) {
		component = LinkUIPageCreator;
	}
	const componentName = className;

	const dialogTitleId = useInstanceId(
		component,
		`${ componentName }__title`
	);
	const dialogDescriptionId = useInstanceId(
		component,
		`${ componentName }__description`
	);
	const focusOnMountRef = useFocusOnMount( 'firstElement' );
	const backButtonClassName = `${ className }__back`;

	return (
		<div
			className={ className }
			role="dialog"
			aria-labelledby={ dialogTitleId }
			aria-describedby={ dialogDescriptionId }
			ref={ focusOnMountRef }
		>
			<VisuallyHidden>
				<h2 id={ dialogTitleId }>{ title }</h2>
				<p id={ dialogDescriptionId }>{ description }</p>
			</VisuallyHidden>

			<BackButton className={ backButtonClassName } onBack={ onBack } />

			{ children }
		</div>
	);
}

export default DialogWrapper;
