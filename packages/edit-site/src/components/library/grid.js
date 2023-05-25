/**
 * WordPress dependencies
 */
import { Button, __experimentalHStack as HStack } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { moreHorizontal } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import usePatterns from './use-patterns';

export default function Grid() {
	const patterns = usePatterns();

	if ( ! patterns ) {
		return null;
	}

	if ( ! patterns.length ) {
		return <div>{ __( 'No patterns found.' ) }</div>;
	}

	return (
		<div className="edit-site-library__grid">
			{ patterns.map( ( pattern ) => (
				<div key={ pattern.id } className="edit-site-library__pattern">
					<div className="edit-site-library__preview">
						{ pattern.id }
					</div>
					<HStack
						className="edit-site-library__footer"
						justify="space-between"
					>
						<span>{ pattern.title.rendered }</span>
						<Button
							className="edit-site-library__button"
							icon={ moreHorizontal }
							isSmall
						/>
					</HStack>
				</div>
			) ) }
		</div>
	);
}
