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
					<li
						key={ [ setIndex, controlIndex ].join() }
						className={ setIndex > 0 && controlIndex === 0 ? 'has-left-divider' : null }
					>
						<IconButton
							icon={ control.icon }
							label={ control.title }
							data-subscript={ control.subscript }
							onClick={ ( event ) => {
								event.stopPropagation();
								control.onClick();
							} }
							className={ classNames( 'components-toolbar__control', {
								'is-active': control.isActive,
							} ) }
							aria-pressed={ control.isActive }
							focus={ focus && setIndex === 0 && controlIndex === 0 }
							disabled={ control.isDisabled }
						/>
						{ control.children }
					</li>
				) ),
			], [] ) }
		</ul>
	);
}

export default Toolbar;
