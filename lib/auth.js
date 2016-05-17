/*
Package that allows for authorization keys and region to be handled.
*/


function Auth(){
	this.props = {
		apiVersion : '2016-05-12'
	}
}

/*
   Function: updateAuthKeys
   Updates the access and secret keys by creating a new cloudwatch object. Updating keys replaces the previous keys for all future queries. 
*/
Auth.prototype.updateAuthKeys = function(accessKeyId, secretAccessKey){
	this.props.accessKeyId = accessKeyId;
	this.props.secretAccessKey = secretAccessKey;
}

/*
   Function: updateAccessKeyId
   Updates the accessKeyId by creating a new cloudwatch object. Updating keys replaces the previous keys for all future queries. If you are updating both keys, use the function updateAuthKeys instead; it's faster than calling this and updateSecretAccessKey.
*/
Auth.prototype.updateAccessKeyId = function(accessKeyId){
	this.props.accessKeyId = accessKeyId;
}

/*
   Function: updateSecretAccessKey
   Updates the secretAccessKey by creating a new cloudwatch object. Updating keys replaces the previous keys for all future queries. If you are updating both keys, use the function updateAuthKeys instead; it's faster than calling this and updateAccessKeyId.
*/
Auth.prototype.updateSecretAccessKey = function(secretAccessKey){
	this.props.secretAccessKey = secretAccessKey;
}

/*
   Function: updateRegion
   Updates the region (e.g. us-east-1) by creating a new cloudwatch object. Updating the region replaces the previous region for all future queries.
*/
Auth.prototype.updateRegion = function(targetRegion){
	this.props.region = targetRegion;
}

/*
   Function: shortName
   Updates this.shortName to enable database queries/key-value stores indexed
   by some name.

*/

Auth.prototype.updateShortName = function(name){
	this.shortName = name
}

module.exports = Auth;
