/**
 * WordPress dependencies
 */
import { Suspense, lazy, useEffect, useState } from '@wordpress/element';
import { useBlockProps } from '@wordpress/block-editor';

const FallbackEdit = ( { tempContent, setTempContent } ) => {
	const blockProps = useBlockProps();
	const onChange = ( e ) => {
		setTempContent( e.target.value );
	};

	return (
		<div { ...blockProps }>
			<input value={ tempContent } onChange={ onChange } />
		</div>
	);
};

// Sets the block content on mount
const Init = ( { content, setContent } ) => {
	useEffect( () => {
		if ( content.length > 0 ) {
			setContent( content );
		}
	}, [] );

	return null;
};

// Add delay to the module load for better debugging
const delay = async ( cb, ms = 0 ) => {
	if ( ms > 0 ) {
		await new Promise( ( r ) => setTimeout( r, ms ) );
	}
	return await cb();
};

export default function lazyEdit( cb ) {
	// eslint-disable-next-line @wordpress/no-unused-vars-before-return
	const Load = lazy( () => delay( cb, 3000 ) );
	return function Edit( props ) {
		// captures what was typed into the placeholder while loading
		const [ tempContent, setTempContent ] = useState( '' );
		return (
			<Suspense
				fallback={
					<FallbackEdit
						tempContent={ tempContent }
						setTempContent={ setTempContent }
					/>
				}
			>
				<Init
					content={ tempContent }
					setContent={ ( content ) =>
						props.setAttributes( { content } )
					}
				/>
				<Load { ...props } />
			</Suspense>
		);
	};
}
