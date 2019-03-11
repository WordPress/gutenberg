export default class Block {

    var accessibilityIdKey = 'name';

    const rnPlatform = process.env.TEST_RN_PLATFORM || defaultPlatform;
    if(rnPlatform === 'android' ) {
        accessibilityIdKey = 'content-desc';
    }

    Set.prototype.difference = function(nextSet) 
    { 
        // creating new set to store differnce 
        var differenceSet = new Set(); 
    
        // iterate over the values 
        for(var elem of this) 
        { 
            // if the value[i] is not present  
            // in nextSet add to the differenceSet 
            if(!nextSet.has(elem)) 
                differenceSet.add(elem); 
        } 
    
        // returns values of differenceSet 
        return differenceSet; 
    } 

    const typeString = async (element, str) => { // iOS: Problem with Appium type function needing to be cleared after first attempt
        if ( rnPlatform === 'android') {
            await element.clear();
		    return await element.type(str);
        }
		await element.clear();
		await element.type(str);
		await element.clear();
		return await element.type(str);
	};
}