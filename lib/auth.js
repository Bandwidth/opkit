/** @namespace Auth*/

function Auth(){
	this.props = {
		apiVersion : '2016-05-12'
	};
}

/**
 * Updates the access and secret keys. 
 * @param {string} accessKeyId - the AWS Access Key ID.
 * @param {string} secretAccessKey - the AWS Secret Access Key.
 */
Auth.prototype.updateAuthKeys = function(accessKeyId, secretAccessKey){
	this.props.accessKeyId = accessKeyId;
	this.props.secretAccessKey = secretAccessKey;
};

/**
 * Updates the access key. 
 * @param {string} accessKeyId - the AWS Access Key ID.
 */
Auth.prototype.updateAccessKeyId = function(accessKeyId){
	this.props.accessKeyId = accessKeyId;
};

/**
 * Updates the secret key. 
 * @param {string} secretAccessKey - the AWS Secret Access Key.
 */
Auth.prototype.updateSecretAccessKey = function(secretAccessKey){
	this.props.secretAccessKey = secretAccessKey;
};

/**
 * Updates the AWS region (i.e. 'us-east-1'). 
 * @param {string} targetRegion - the AWS region.
 */
Auth.prototype.updateRegion = function(targetRegion){
	this.props.region = targetRegion;
};

/**
 * Updates the auth object's short name.
 * @param {string} name - the short name to use.
*/

Auth.prototype.updateShortName = function(name){
	this.shortName = name;
};

module.exports = Auth;
