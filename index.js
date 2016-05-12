//TEST CODE TO BE CHANGED LATER

module.exports = {

	// return true if the two vectors are equal
	equals: function(a,b) {
		if (a.length != b.length)
			return false;
		for (i = 0; i < a.length; i++)
			if (a[i] != b[i])
				return false;
		return true;
	},
	
	firstEltBigger: function(a,b) {
		if (a[0] > b[0])
		{
			return true;
		}
		return false;
	}
}