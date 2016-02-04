$.index.open();

/****************************************************
 *      AUTHENTICATION
 */
function doLogin(e) {
	Titanium.API.info("You clicked the login button");

	var promise = Kinvey.User.MIC.loginWithAuthorizationCodeLoginPage('http://localhost:8100');
	promise.then(function(user) {
		Titanium.API.info('success with MIC');

		// you're logged in so only show logout button
		//
		$.loginBtn.visible = false;
		$.logoutBtn.visible = true;

		// now, that you're logged in move to the products tab
		//
		$.index.setActiveTab(1);
		
		// now that you have an active user, register for push
		//
		return registerForPush(user);
	}).then(function(err) {
		Titanium.API.info(err);
	});

}

// just logs the user out and toggles the login/logout buttons
//
function doLogout(e) {
	Titanium.API.info("You clicked the logout button");
	
	var user = Kinvey.getActiveUser();
	
	// if user is null, then you're already logged out
	//
	if (null !== user) {
		var promise = Kinvey.User.logout();
		promise.then(function() {
			Titanium.API.info('success logging out');
			
			// toggle login/logout buttons appropriately
			//
			$.loginBtn.visible = true;
			$.logoutBtn.visible = false;
		}, function(error) {
			Titanium.API.info('error logging out');
		});
	}
}

/**********************************************************
 *    TAB HANDLERS
 *
 *  There is one of each of these for the Products, Partners, Todos, Collteral, and Insert tabs
 */
function fileClick(e) {
	Titanium.API.info('file item clicked');
	
	// which file was clicked?
	//
	Titanium.API.info(e.itemIndex);
	
	// show file handle?
	//
	Titanium.API.info(pdffiles[e.itemIndex]._downloadURL);

	// we have the downloadURL, now just grab it and set it to a temporary local file for viewing
	//
	var xhr = Titanium.Network.createHTTPClient({
		onload : function() {
			// first, grab a "handle" to the file where you'll store the downloaded data
			var f = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'test.pdf');
			f.write(this.responseData);

			// write to the file
			Ti.App.fireEvent('pdf_downloaded', {
				filepath : f.nativePath
			});
		},
		timeout : 10000
	});
	xhr.open('GET', pdffiles[e.itemIndex]._downloadURL);
	xhr.send();
	Ti.App.addEventListener('pdf_downloaded', function(e) {
		// show the pdf in the documentviewer
		//
		$.pdfshow.url = e.filepath;
		$.pdfshow.show({
			animated : true
		});
	});

}

//  This is invoked when someone clicks on the products tab or refreshes the products tab screen
//  with the pulldown
//
function getProducts(e) {
	Titanium.API.info("You clicked the getProducts tab");

	var promise = Kinvey.DataStore.find('vProducts', null);
	promise.then(function(entities) {
		Titanium.API.info(entities);

		// save currentEntities for later indexing
		//
		currentProducts = entities;

		// alter productlist tab with entities
		//
		var items = _.map(entities, function(element) {
			// here we just bind the returned values to the UI
			//
			return {
				properties : {
					data : element
				},
				productname : {
					text : element.productname
				},
				productdesc : {
					text : element.productdesc
				}
			};
		});

		$.productListSection.setItems(items);

	}, function(error) {
		Titanium.API.info('error fetching products');
	});
};

//  This is invoked when someone clicks on the partners tab or refreshes the partners tab screen
//  with the pulldown
//
function getPartners(e) {
	Titanium.API.info("You clicked the getPartners tab");

	var promise = Kinvey.DataStore.find('partner', null);
	promise.then(function(entities) {
		Titanium.API.info(entities);

		// map the returned Kinvey entity to the UI
		//
		var items = _.map(entities, function(element) {
			return {
				properties : {
					data : element
				},
				partnername : {
					text : element.partnername
				},
				partnercompany : {
					text : element.partnercompany
				}
			};
		});

		$.partnerListSection.setItems(items);

	}, function(error) {
		Titanium.API.info('error fetching products');
	});
};

//  This is invoked when someone clicks on the todo tab or refreshes the todo tab screen
//  with the pulldown
//
function getTodos(e) {
	Titanium.API.info("You clicked the getTodos tab");
	
	var promise = Kinvey.DataStore.find('todo', null);
	promise.then(function(entities) {
		Titanium.API.info(entities);

		// alter todolist with entities
		//
		var items = _.map(entities, function(element) {
			return {
				properties : {
					data : element
				},
				myaction : {
					text : element.action
				},
				myduedate : {
					text : element.duedate
				},
				mycompleted : {
					text : 'completed: ' + element.completed
				}
			};
		});

		$.TodoListSection.setItems(items);

	}, function(error) {
		Titanium.API.info('error fetching products');
	});
};

// Here, we're just going to pull all PDFs from the filestore
// This is invoked when you go to the Collteral tab
//
function getCollateral(e) {
	Titanium.API.info("You clicked the getCollateral tab");

	var query = new Kinvey.Query();
	
	// only pull PDFs
	//
	query.equalTo('mimeType', 'application/pdf');
	var promise = Kinvey.File.find(query);
	promise.then(function(files) {

		Titanium.API.info(files);
		
		// set for later indexing
		//
		pdffiles = files;

		// map returned Kinvey entity to the UI
		//
		var items = _.map(files, function(element) {
			return {
				properties : {
					data : element
				},
				prettyname : {
					text : element.prettyname
				}
			};
		});

		$.CollListSection.setItems(items);

	}, function(error) {
		Titanium.API.info('error fetching products');
	});
};


function insertTask() {
	Titanium.API.info('insert clicked');
	var mydata = {};
	var mycomplete = false;

	if ($.completedSwitch.value == 0) {
		mycomplete = false;
	} else {
		mycomplete = true;
	}
	mydata.action = $.mytask.value;
	mydata.duedate = $.myduedate.value;
	mydata.completed = mycomplete;
	mydata.class = "personal";
	mydata.Title = "Personal Action Item";

	Titanium.API.info(mydata);
	var promise = Kinvey.DataStore.save('todo', mydata);
	promise.then(function(entity) {
		Titanium.API.info(entity);
	}, function(error) {
		Titanium.API.info(error);
	});
}


/***************************************************************
 *   KINVEY INIT METHOD
 */

function init() {
	// Initialize Kinvey to point your app to your instance of Kinvey
	// MICAPIVersion needed for Mobile Identity Connect
	
	Kinvey.MICAPIVersion = 2;
	Kinvey.init({
		micHostName : 'https://vmwus1-auth.kinvey.com',
		apiHostName : 'https://vmwus1-baas.kinvey.com',
		appKey : 'kid_ZJb6V2mWTe',
		appSecret : '0b367baf6c3947bbafa6f59c928f2cdd',
		sync : {
			enable : true,
			online : Titanium.Network.getOnline()  // The initial application state.
		}
	}).then(function(activeUser) {
		Titanium.API.info('Kinvey init complete');
		// setting a standard value that gets placed in the header for later inspection
		//
		Kinvey.ClientAppVersion.setVersion('1.3');
		
		// setting a custom value that gets placed in the header for later inspection
		//
		var property = {};
		property.companyname = "vmware";
		Kinvey.CustomRequestProperties.addProperties(property);
		Titanium.API.info(Kinvey.CustomRequestProperties.properties());

		// when we first initialize, we want to set the login/logout
		// buttons to their appropriate state, based on whether
		// an active user exists
		//
		if (activeUser) {
			$.loginBtn.visible = false;
			$.logoutBtn.visible = true;
			return registerForPush();
		} else {
			$.loginBtn.visible = true;
			$.logoutBtn.visible = false;
		}
	}, function(error) {
		Titanium.API.info('error initializing Kinvey');
	}).catch(function(error) {
		Titanium.API.error(error);
	});

	// Switch application state when the network state changes.
	// Set up for sync when network state changes
	//
	Titanium.Network.addEventListener('change', function(e) {
		if (e.online) {
			Kinvey.Sync.online();
			Titanium.API.info('going online');
		} else {
			Kinvey.Sync.offline();
			Titanium.API.info('going offline');
		}
	});

	Titanium.API.info('initialized');
}


/**************************************************************************
 *    PUSH NOTIFICATIONS
 */

function registerForPush(user) {
	Titanium.API.info('inside registerForPush');
	
	
	Titanium.API.info('# of existing registered devices for this user: ' + Kinvey.getActiveUser()._messaging.pushTokens.length);

	// if token is not alreaady registered for this user, register
	// if one is registered, use it
	//
	if (Kinvey.getActiveUser()._messaging.pushTokens.length < 1) {
		Titanium.API.info('no push tokens found, registering for push...');

		var deviceToken = null;
		if (Ti.Platform.name === 'iPhone OS') {
			Titanium.API.info('detected iOS for push');
			
			// Titanium has a different way to register for iOS < 8
			//
			if (parseInt(Ti.Platform.version.split(".")[0]) >= 8) {

				// Wait for user settings to be registered before registering for push notifications
				//
				Ti.App.iOS.addEventListener('usernotificationsettings', function _registerForPush() {
					
					// Remove event listener once registered for push notifications
					Ti.App.iOS.removeEventListener('usernotificationsettings', _registerForPush);

					Ti.Network.registerForPushNotifications({

						success : function deviceTokenSuccess(e) {
							Titanium.API.info('devicetoken success');
							Titanium.API.info(e);
							if (Kinvey.getActiveUser() == null) {
								// Error: there must be a logged-in user.
								Titanium.API.info('there must be a logged in user');
							} else {
								Titanium.API.info('registering for push');
								Kinvey.Push.register(e.deviceToken).then(function() {
									// Successfully registered device with Kinvey.
									Titanium.API.info('successfully registered for push');
								}, function(error) {
									// Error registering device with Kinvey.
									Titanium.API.info('error registering for push');
									Titanium.API.info(error);
								});
							}
						},
						error : deviceTokenError,
						callback : receivedPushNotification
					});
				});

				// Register notification types to use
				//
				Ti.App.iOS.registerUserNotificationSettings({
					types : [Ti.App.iOS.USER_NOTIFICATION_TYPE_ALERT, Ti.App.iOS.USER_NOTIFICATION_TYPE_SOUND, Ti.App.iOS.USER_NOTIFICATION_TYPE_BADGE]
				});
			}
			// For iOS7 and earlier
			//
			else {
				Titanium.API.info('iOS7 and earlier');
				Ti.Network.registerForPushNotifications({
					// Specifies which notifications to receive
					types : [Ti.Network.NOTIFICATION_TYPE_BADGE, Ti.Network.NOTIFICATION_TYPE_ALERT, Ti.Network.NOTIFICATION_TYPE_SOUND],
					success : deviceTokenSuccess,
					error : deviceTokenError,
					callback : receivedPushNotification
				});
			}
		}
	} else {
		Titanium.API.info("push token exists.  Don't register");
	}
}

// Process incoming push notifications
//
function receivedPushNotification(e) {
	Titanium.API.info('Received push: ' + JSON.stringify(e));
	alert(e.data.alert);
}

// Invoked if there is an error registering for push
//
function deviceTokenError(e) {
	Titanium.API.info('Failed to register for push notifications! ' + e.error);
}

// the buttonbar only returns the index of the button clicked,
// so this is a router to route to the appropriate function, based on button clicked
//
function processButtonBar(e) {
	Titanium.API.info('processbuttonbar');
	Titanium.API.info(e.index);

	if (e.index == 0) {
		limit4();
	} else if (e.index == 1) {
		sortme();
	} else if (e.index == 2) {
		skipme();
	}
}


/********************************************************************
 *    These are helper functions for the ButtonBar on the Products tab
 * *
 */

// sorts the Product list based on productname
//
function sortme() {
	Titanium.API.info('inside sortme');

	// Sort on productname
	//
	var query = new Kinvey.Query();
	query.descending('productname');

	var promise = Kinvey.DataStore.find('vProducts', query);

	promise.then(function(entities) {
		Titanium.API.info(entities);

		// map the properties of the returned Kinvey entity back to the UI
		//
		var items = _.map(entities, function(element) {
			return {
				properties : {
					data : element
				},
				productname : {
					text : element.productname
				},
				productdesc : {
					text : element.productdesc
				}
			};
		});
		// clear the list first
		//
		$.productListSection.setItems([]);
		$.productListSection.setItems(items);

	}, function(error) {
		Titanium.API.info(error);
	});

}

// this gets invoked when someone clicks on a productlistitem on the products tab
//
function deleteme(e) {
	Titanium.API.info('inside deleteme');

	// Show the name of the product clicked
	//
	Titanium.API.info(currentProducts[e.itemIndex].productname);

	// pass to the destroy method the _id of the clicked Product
	//
	var promise = Kinvey.DataStore.destroy('vProducts', currentProducts[e.itemIndex]._id);
	promise.then(function() {
		Titanium.API.info('successful delete');
		alert('item deleted');
	}, function(error) {
		Titanium.API.info('error deleting');
	});

}

// this shows how to use the skip method
// in conjunction with the limit method, this can be
// used to set up pagination if a LOT of content is to be
// delivered and you want to fetch a "page" at a time
//
function skipme() {
	Titanium.API.info('inside skipme');

	// Limit and skip modifiers allow for paging of results. Set the limit to the number of results 
	// you want to show per page. The skip modifier indicates how many results are skipped from 
	// the beginning.
	//
	var query = new Kinvey.Query();
	query.limit(1);
	query.skip(0);

	var promise = Kinvey.DataStore.find('vProducts', query);

	promise.then(function(entities) {
		Titanium.API.info(entities);
		var items = _.map(entities, function(element) {
			return {
				properties : {
					data : element
				},
				productname : {
					text : element.productname
				},
				productdesc : {
					text : element.productdesc
				}
			};
		});
		
		// we're resetting the list based on the fact that we've deleted
		// first, reset the list
		//
		$.productListSection.setItems([]);
		$.productListSection.setItems(items);

	}, function(error) {
		Titanium.API.info(error);
	});

}

// invoked when you click the limit button on the buttonbar on the products tab
// this demonstrates the limit function, which can be used in conjunction with skip
// to enable "paging"
//
function limit4(e) {
	Titanium.API.info('limit4');
	var query = new Kinvey.Query();
	
	// set the limit.  This is typically equivalent to the number of
	// items you'll want to show on a given page
	//
	query.limit(4);
	var promise = Kinvey.DataStore.find('vProducts', query);
	promise.then(function(entities) {
		Titanium.API.info(entities);
		
		// mapped the returned Kinvey entity back to the UI
		//
		var items = _.map(entities, function(element) {
			return {
				properties : {
					data : element
				},
				productname : {
					text : element.productname
				},
				productdesc : {
					text : element.productdesc
				}
			};
		});
		// reset the product list and reapply
		//
		$.productListSection.setItems([]);
		$.productListSection.setItems(items);

	}, function(error) {
		Titanium.API.info(error);
	});
}

init();

