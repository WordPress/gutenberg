/**
 * WordPress dependencies
 */

export default function useClientWidth( ref, dependencies ) {
	const [ clientWidth, setClientWidth ] = useState();

	function calculateClientWidth() {
		setClientWidth( ref.current.clientWidth );
	}

	useEffect( calculateClientWidth, dependencies );
	useEffect( () => {
		const { defaultView } = ref.current.ownerDocument;

		defaultView.addEventListener( 'resize', calculateClientWidth );

		return () => {
			defaultView.removeEventListener( 'resize', calculateClientWidth );
		};
	}, [] );

	return clientWidth;
}
