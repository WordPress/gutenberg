export default function AttributeInput( { attribute, setAttributes, value = '', ...inputProps } ) {
	return <input value={ value } onChange={ ( e ) => setAttributes( { [ attribute ]: e.target.value } ) } { ...inputProps } />;
}
