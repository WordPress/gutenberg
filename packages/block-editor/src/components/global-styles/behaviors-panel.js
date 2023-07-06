/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export function __experimentalUseHasBehaviorsPanel( blockName ) {
	if ( blockName === 'core/image' ) {
		return true;
	}
	return false;
}

export default function ( { onChange, value, behaviors } ) {
	const defaultBehaviors = {
		default: {
			value: 'default',
			label: __( 'Default' ),
		},
		noBehaviors: {
			value: '',
			label: __( 'No behaviors' ),
		},
	};

	const behaviorsOptions = Object.entries( behaviors ).map(
		( [ behaviorName ] ) => ( {
			value: behaviorName,
			// Capitalize the first letter of the behavior name.
			label: `${ behaviorName.charAt( 0 ).toUpperCase() }${ behaviorName
				.slice( 1 )
				.toLowerCase() }`,
		} )
	);

	const options = [
		...Object.values( defaultBehaviors ),
		...behaviorsOptions,
	];

	return (
		<div style={ { marginTop: '2rem' } }>
			<SelectControl
				label={ __( 'Behaviors' ) }
				// At the moment we are only supporting one behavior (Lightbox)
				value={ value }
				options={ options }
				onChange={ onChange }
				hideCancelButton={ true }
				size="__unstable-large"
			/>
		</div>
	);
}
