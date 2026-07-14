export function shouldCaptureToolbars( exposedControls ) {
	return (
		exposedControls === true ||
		( Array.isArray( exposedControls ) && exposedControls.length > 0 )
	);
}
