/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';
import IconButton from '../icon-button';

function Toolbar( { controls, focus } ) {
	if ( ! controls || ! controls.length ) {
		return null;
	}

	// Normalize controls to nested array of objects (sets of controls)
	let controlSets = controls;
	if ( ! Array.isArray( controlSets[ 0 ] ) ) {
		controlSets = [ controlSets ];
	}

	return (
		<ul className="components-toolbar">
			{ controlSets.reduce( ( result, controlSet, setIndex ) => [
				...result,
				...controlSet.map( ( control, controlIndex ) => (
					<IconButton
						key={ [ setIndex, controlIndex ].join() }
						icon={ control.icon }
						label={ control.title }
						data-subscript={ control.subscript }
						onClick={ ( event ) => {
							event.stopPropagation();
							control.onClick();
						} }
						className={ classNames( 'components-toolbar__control', {
							'is-active': control.isActive,
							'has-left-divider': setIndex > 0 && controlIndex === 0,
						} ) }
						aria-pressed={ control.isActive }
						focus={ focus && setIndex === 0 && controlIndex === 0 }
					/>
				) ),
			], [] ) }
		</ul>
	);
}

export default Toolbar;
