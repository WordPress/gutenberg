/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

export default function BlockBreadcrumbButton( { children, ...props } ) {
	return <Button
		className="block-editor-block-breadcrumb__button"
		px={ 'medium' }
		py={ 0 }
		color={ 'dark-gray-500' }
		fontSize={ 'inherit' }
		line-height={ 'xlarge' }
		height={ 'xlarge' }
		isTertiary
		{ ...props }
	>
		{ children }
	</Button>;
}
