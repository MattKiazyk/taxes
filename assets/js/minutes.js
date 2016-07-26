
$(document).ready(function () {
	Handlebars.registerHelper('minutesInfo', function(items, options) {
		var minutes = options.data.root
		var enquiryArray = []
		for (var k in minutes) {
			enquiryArray.push(minutes[k])
		}

		// sort based on date
		enquiryArray.sort(date_sort)
		var q = getParameterByName('q')
		if (q == null || q == "" || q == " ") {
			q = " last meeting "
		} else {
			q = " with '" + q + "' found since January 1, 2008"
		}

		var out = "<div class='12u'>" + enquiryArray.length + " enquiries" + q + "</div>"
		
		for (var k in enquiryArray) {
			var value = enquiryArray[k]
			out += "<div class='3u 12u(narrower)'>"
				out += "<div class='sidebar'>"
					out += "<img src='../assets/images/" + value.councillor + ".jpg' height='180'>"
					out += "<header>" + value.councillor + "</header>"
				out += "</div>"
			out += "</div>"
			
			out += "<div class='9u 12u(narrower)'>"
				out += "<header><h3>"
				out += value.title
				out += "<br /><a href='" + value.url + "' target='_blank'>" + value.date + "</a>"
				out += "</h3></header>"

				out += "<div class='enquiryDescription line'>"
					out += value.enquiry
				out += "</div>"		
			out += "</div>"

		}
		out += ""
		return out
	})

	function date_sort(a, b) {
	    return new Date(b.date).getTime() - new Date(a.date).getTime();
	}
})

$( window ).load(function() {

	// load Minutes from Firebase Databases	
	var minutesSource = $('#minutes-template').html();
	var minutesTemplate = Handlebars.compile(minutesSource);
	
	var dbURL = 'https://minutes-1969a.firebaseio.com'
	firebase.initializeApp({
		databaseURL:dbURL
	})

	$('#minutes-wrapper').wait();

	var search = getParameterByName('q')
	if (search == null || search == "" || search == " ") {
		//gets latest minutes from last parse
		firebase.database().ref('config').once('value').then(function(snapshot) {
			var lastUpdated = snapshot.val().lastUpdated
			
			firebase.database().ref('minutes/' + lastUpdated).once('value').then(function(snapshot) {
				var minutesHTML = minutesTemplate(snapshot.val())
				$('#minutes-template').replaceWith(minutesHTML)
				$('#minutes-wrapper').unwait();
			})
		})	
	} else {
		console.log("Searching for: " + search)
		$('#enquirySearch').val(search)
		var start = Date.now();

		$.getJSON( dbURL + '/minutes.json', function( data ) {
		  // get the snapshot with a callback function
			Defiant.getSnapshot(data, function(snapshot) {
			    console.log('Created snapshot in '+ (Date.now() - start) +' ms');

			    // searching on snapshot created with web worker
			    var found = JSON.search(snapshot, '//*[contains(enquiry, "' + search +'")]');
					if (found != '') {
						var minutesHTML = minutesTemplate(found)
						$('#minutes-template').replaceWith(minutesHTML)
					} else {
						$('#minutes-template').replaceWith('<h2>No results found</h2>')
					}
					$('#minutes-wrapper').unwait();
			});
		});
		
	}
	
})