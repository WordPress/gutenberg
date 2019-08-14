/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

const IconPicker = ( { icons, onClick } ) => {
	return (
		<div className="wp-block-social-link__icon-picker">
			{
				icons.map( ( icon ) => {
					const classes = classNames( 'wp-social-icon', `wp-social-icon-${ icon }` );
					return (
						<Button
							key={ icon }
							className={ classes }
							onClick={ () => onClick( icon ) }
						></Button>
					);
				} )
			}
		</div>
	);
};

export default IconPicker;
