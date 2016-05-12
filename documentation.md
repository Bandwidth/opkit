### Opkit Documentation


#### AWS Authentication and Configuration
The three parameters that must be set before queries are the two keys (the accessKeyId and secretAccess Key), as well as the region.  
`updateAuthKeys(accessKeyId, secretAccessKey)` sets the keys. If only one key needs to be updated, the functions `updateAccessKeyId` and `updateSecretAccessKey` do just that.  
`updateRegion(targetRegion)` similarly updates the region.  
Once the key(s) is/are updated, or the region is changed, all queries will use the new keys.

#### Querying AWS alarms
All queries take a callback function as a parameter. That function is called with parameters `(err, data)` when the IO calls to Amazon are finished and the output is "returned" in `data`; it is suggested to have your bot speak in that function. The `err` field contains the error from Amazon, if any.  
`queryAlarmsByState(state, callback)` returns a Javascript object containing a significant amount of information about your JS alarms. state can be one of `['OK', 'INSUFFICIENT_DATA', 'ALARM']`.  
`queryAlarmsByStateReadably(state, callback)` returns a pretty, newline separated list of the alarms with that particular state, suitable to be "said" by your bot.  
`countAlarmsByState(state, callback)` returns the number of alarms with that state.  
`healthReportByState(state)` returns a pretty, human-readable report of how many alarms have each of the three states.
