import clsx from 'clsx';
import { __, _x, sprintf } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { ToggleControl } from '@wordpress/components';
import ResponsiveBlockControlLabel from './label';

/**
 * ResponsiveBlockControl Component
 *
 * A UI component for managing responsive block properties in the WordPress block editor.
 * Allows toggling between a unified property value for all screen sizes or custom values
 * for specific screen sizes.
 *
 * @param {Object}        props                            - Component properties.
 * @param {string}        props.title                      - The title displayed above the control.
 * @param {string}        props.property                   - The CSS property controlled by the component (e.g., "margin").
 * @param {string}        [props.toggleLabel]              - Custom label for the toggle control.
 * @param {Function}      props.onIsResponsiveChange       - Callback function triggered when the responsive toggle is switched.
 * @param {Function}      props.renderDefaultControl       - Function to render the default (non-responsive) control.
 * @param {Function}      [props.renderResponsiveControls] - Optional function to render custom responsive controls.
 * @param {boolean}       [props.isResponsive=false]       - Determines whether responsive controls are displayed.
 * @param {Object}        [props.defaultLabel]             - Label for the default "All" control.
 * @param {string}        props.defaultLabel.id            - ID for the default "All" control (e.g., 'all').
 * @param {string}        props.defaultLabel.label         - Label text for the default "All" control.
 * @param {Array<Object>} [props.viewports]                - List of viewport configurations for responsive controls.
 * @param {string}        props.viewports[].id             - ID for the viewport (e.g., 'small', 'medium', 'large').
 * @param {string}        props.viewports[].label          - Label text for the viewport.
 * @return {Element|null} The ResponsiveBlockControl component or null if required props are missing.
 *
 * @example
 * <ResponsiveBlockControl
 *     title="Margin"
 *     property="margin"
 *     onIsResponsiveChange={ handleResponsiveChange }
 *     renderDefaultControl={ (label) => <div>{label} <input type="text" /></div> }
 *     isResponsive={false}
 *     defaultLabel={{ id: 'all', label: 'All' }}
 *     viewports={[
 *         { id: 'small', label: 'Small screens' },
 *         { id: 'medium', label: 'Medium screens' },
 *         { id: 'large', label: 'Large screens' }
 *     ]}
 * />
 */
function ResponsiveBlockControl( props ) {
	const {
		title,
		property,
		toggleLabel,
		onIsResponsiveChange,
		renderDefaultControl,
		renderResponsiveControls,
		isResponsive = false,
		defaultLabel = {
			id: 'all',
			label: _x( 'All', 'screen sizes' ),
		},
		viewports = [
			{
				id: 'small',
				label: __( 'Small screens' ),
			},
			{
				id: 'medium',
				label: __( 'Medium screens' ),
			},
			{
				id: 'large',
				label: __( 'Large screens' ),
			},
		],
	} = props;

	if ( ! title || ! property || ! renderDefaultControl ) {
		return null;
	}

	const toggleControlLabel =
		toggleLabel ||
		sprintf(
			/* translators: %s: Property value for the control (eg: margin, padding, etc.). */
			__( 'Use the same %s on all screen sizes.' ),
			property
		);

	const toggleHelpText = __(
		'Choose whether to use the same value for all screen sizes or a unique value for each screen size.'
	);

	const defaultControl = renderDefaultControl(
		<ResponsiveBlockControlLabel
			property={ property }
			viewport={ defaultLabel }
		/>,
		defaultLabel
	);

	const defaultResponsiveControls = () => {
		return viewports.map( ( viewport ) => (
			<Fragment key={ viewport.id }>
				{ renderDefaultControl(
					<ResponsiveBlockControlLabel
						property={ property }
						viewport={ viewport }
					/>,
					viewport
				) }
			</Fragment>
		) );
	};

	return (
		<fieldset className="block-editor-responsive-block-control">
			<legend className="block-editor-responsive-block-control__title">
				{ title }
			</legend>

			<div className="block-editor-responsive-block-control__inner">
				<ToggleControl
					className="block-editor-responsive-block-control__toggle"
					label={ toggleControlLabel }
					checked={ ! isResponsive }
					onChange={ onIsResponsiveChange }
					help={ toggleHelpText }
				/>
				<div
					className={ clsx(
						'block-editor-responsive-block-control__group',
						{
							'is-responsive': isResponsive,
						}
					) }
				>
					{ ! isResponsive && defaultControl }
					{ isResponsive &&
						( renderResponsiveControls
							? renderResponsiveControls( viewports )
							: defaultResponsiveControls() ) }
				</div>
			</div>
		</fieldset>
	);
}

export default ResponsiveBlockControl;
