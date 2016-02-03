$.index.open();

/****************************************************
 *      AUTHENTICATION
 */
function doLogin(e) {
	Titanium.API.info("You clicked the login button");
	Kinvey.MICAPIVersion = 2;
	//var promise = Kinvey.User.login('delacey@kinvey.com', 'xxx');
	var promise = Kinvey.User.MIC.loginWithAuthorizationCodeLoginPage('http://localhost:8100');
	promise.then(function(user) {
		Titanium.API.info('success with MIC');
		$.loginBtn.visible = false;
		$.logoutBtn.visible = true;
		return registerForPush(user);
	}).then(function() {
		$.tabGroup.setActiveTab(1);
	}, function(err) {
		Titanium.API.info(err);
		Titanium.API.info('error with MIC' + e.toString());
	});
	
}

function doLogout(e) {
	Titanium.API.info("You clicked the logout button");
	var user = Kinvey.getActiveUser();
	if (null !== user) {
		var promise = Kinvey.User.logout();
		promise.then(function() {
			Titanium.API.info('success logging out');
			$.loginBtn.visible = true;
			$.logoutBtn.visible = false;
		}, function(error) {
			Titanium.API.info('error logging out');
		});
	}
}


/**********************************************************
 *    TAB HANDLERS
 */

function fileClick(e) {
	Titanium.API.info('file item clicked');
	Titanium.API.info(pdffiles[0]._downloadURL);
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
	xhr.open('GET', pdffiles[0]._downloadURL);
	xhr.send();
	Ti.App.addEventListener('pdf_downloaded', function(e) {
		// you don't have to fire an event like this, but perhaps multiple components will
		// want to know when the image has been downloaded and saved
		//win.remove(loadingLabel);
		//image.image = e.filepath;
		$.pdfshow.url = e.filepath;
		$.pdfshow.show({
			animated : true
		});
	});

}

function getProducts(e) {
	Titanium.API.info("You clicked the getProducts tab");
	var promise = Kinvey.DataStore.find('vProducts', null);
	promise.then(function(entities) {
		Titanium.API.info(entities);
		//alter productlist with entities
currentProducts = entities;
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

		$.productListSection.setItems(items);

	}, function(error) {
		Titanium.API.info('error fetching products');
	});
};

function getPartners(e) {
	Titanium.API.info("You clicked the getPartners tab");
	var promise = Kinvey.DataStore.find('partner', null);
	promise.then(function(entities) {
		Titanium.API.info(entities);
		//alter productlist with entities

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

function getTodos(e) {
	Titanium.API.info("You clicked the getTodos tab");
	var promise = Kinvey.DataStore.find('todo', null);
	promise.then(function(entities) {
		Titanium.API.info(entities);
		//alter productlist with entities

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

function refreshProducts(e) {
	Titanium.API.info('product list pulled');
	getProducts();
}

function refreshPartners(e) {
	Titanium.API.info('partner list pulled');
	getPartners();
}

function refreshTodo(e) {
	Titanium.API.info('todo list pulled');
	getTodos();
}

function refreshColl(e) {
	Titanium.API.info('collateral list pulled');
	getCollateral();
}

function getCollateral(e) {
	Titanium.API.info("You clicked the getCollateral tab");

	var query = new Kinvey.Query();
	query.equalTo('mimeType', 'application/pdf');
	var promise = Kinvey.File.find(query);
	promise.then(function(files) {

		Titanium.API.info(files);
		pdffiles = files;
		//alter productlist with entities

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

/***************************************************************
 *   KINVEY INIT METHOD
 */

function init() {
	Kinvey.MICAPIVersion = 2;
	Kinvey.init({
		micHostName : 'https://vmwus1-auth.kinvey.com',
		apiHostName : 'https://vmwus1-baas.kinvey.com',
		appKey : 'kid_ZJb6V2mWTe',
		appSecret : '0b367baf6c3947bbafa6f59c928f2cdd',
		sync : {
			enable : true,
			online : Titanium.Network.getOnline()// The initial application state.
		}
	}).then(function(activeUser) {
		Titanium.API.info('Kinvey init complete');
		Kinvey.ClientAppVersion.setVersion('1.3');
		var property = {};
		property.companyname = "vmware";
		Kinvey.CustomRequestProperties.addProperties(property);
		Titanium.API.info(Kinvey.CustomRequestProperties.properties());
		
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

    //if ( !initialized ) {
    	//initialized = true;
	// Switch application state when the network state changes.
	Titanium.Network.addEventListener('change', function(e) {
		if (e.online) {
			Kinvey.Sync.online();
			Titanium.API.info('going online');
		} else {
			Kinvey.Sync.offline();
			Titanium.API.info('going offline');
		}
	});
	//}

	Titanium.API.info('initialized');
}

function registerForPush(user) {
	Titanium.API.info('inside registerForPush');
	Titanium.API.info(Kinvey.getActiveUser()._messaging.pushTokens.length);
	
	if (true) {//Kinvey.getActiveUser()._messaging.pushTokens.length < 1 ) {
		Titanium.API.info( 'no push tokens found, registering for push...');
	/*Kinvey.Push.register(e.deviceToken).then(function() {
				// // Successfully registered device with Kinvey.
				 Titanium.API.info('successfully registered for push');
			 }, function(error) {
				// // Error registering device with Kinvey.
				 Titanium.API.info('error registering for push');
			 });*/
		 
	
	var deviceToken = null;
	if (Ti.Platform.name === 'iPhone OS') {
		Titanium.API.info('detected iOS for push');
		if (parseInt(Ti.Platform.version.split(".")[0]) >= 8) {
			Titanium.API.info('after parseInt');
			// Wait for user settings to be registered before registering for push notifications
			Ti.App.iOS.addEventListener('usernotificationsettings', function _registerForPush() {
				Titanium.API.info('inside add event listener');
				// Remove event listener once registered for push notifications
				Ti.App.iOS.removeEventListener('usernotificationsettings', _registerForPush);
				Titanium.API.info('after remove event listener');
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
				Titanium.API.info(Titanium.Platform.getName());
			});
		}
	},
					error : deviceTokenError,
					callback : receivedPushNotification
				});
			});
			// Register notification types to use
			Ti.App.iOS.registerUserNotificationSettings({
				types : [Ti.App.iOS.USER_NOTIFICATION_TYPE_ALERT, Ti.App.iOS.USER_NOTIFICATION_TYPE_SOUND, Ti.App.iOS.USER_NOTIFICATION_TYPE_BADGE]
			});
		}
		// For iOS7 and earlier
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
	Titanium.API.info( "push token exists.  Don't register");
}
}


	// Process incoming push notifications
	function receivedPushNotification(e) {
		Titanium.API.info('Received push: ' + JSON.stringify(e));
		alert( e.data.alert );
	}

	
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
	}

	if (e.index == 1) {
		sortme();
	}

	if (e.index == 2) {
		skipme();
	}
}

function sortme() {
	Titanium.API.info('inside sortme');
	// Sort on last name (ascending), then on age (descending).
	var query = new Kinvey.Query();
	query.descending('productname');

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
		$.productListSection.setItems([]);
		$.productListSection.setItems(items);

	}, function(error) {
		Titanium.API.info(error);
	});

}

function deleteme(e) {
	Titanium.API.info( e );
	Titanium.API.info( e.itemIndex );
	Titanium.API.info(currentProducts[e.itemIndex].productname);
	
	var promise = Kinvey.DataStore.destroy('vProducts', currentProducts[e.itemIndex]._id);
promise.then(function() {
    Titanium.API.info( 'successful delete' );
    alert( 'item deleted');
}, function(error) {
    Titanium.API.info( 'error deleting' );
});
	
}

function skipme() {
	Titanium.API.info('inside skipme');
	// Sort on last name (ascending), then on age (descending).
	var query = new Kinvey.Query();
	query.skip(2);

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
		$.productListSection.setItems([]);
		$.productListSection.setItems(items);

	}, function(error) {
		Titanium.API.info(error);
	});

}

function insertTask() {
	Titanium.API.info( 'insert clicked' );
	var mydata = {};
	var mycomplete = false;
	
	if ( $.completedSwitch.value == 0 ) {
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

function limit4(e) {
	Titanium.API.info('limit4');
	var query = new Kinvey.Query();
	query.limit(4);
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
		$.productListSection.setItems([]);
		$.productListSection.setItems(items);

	}, function(error) {
		Titanium.API.info(error);
	});
}


init();

